import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getPortfolioItems, createPortfolioItem, updatePortfolioItem, deletePortfolioItem,
  getBuyRecords, createBuyRecords, deleteBuyRecord, getLastBuyRecordDate,
  saveSnapshot, getSnapshots,
  getPrincipalRecords, createPrincipalRecord, deletePrincipalRecord,
  getFxRecords, createFxRecord, deleteFxRecord,
  getRealizedGains, createRealizedGain, deleteRealizedGain,
  getUserByEmail, upsertUser,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { hashPassword, verifyPassword } from "./_core/password";
import { sdk } from "./_core/sdk";
import axios from "axios";

const authInput = z.object({
  email: z.string().email().max(320).transform(email => email.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});

const signupInput = authInput.extend({
  name: z.string().trim().min(1).max(80),
});

const portfolioItemInput = z.object({
  ticker: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  nameKr: z.string().max(100).optional(),
  type: z.enum(["us-stock", "kr-stock", "etf", "commodity", "savings", "note"]),
  currency: z.enum(["KRW", "USD"]),
  avgCost: z.number().min(0),
  shares: z.number().min(0),
  buyAmount: z.number().int().min(0),
  buyFrequency: z.enum(["daily", "weekly", "monthly"]),
  sector: z.string().max(100).optional(),
  memo: z.string().optional(),
  maturityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  interestRate: z.number().min(0).optional().nullable(),
  accountType: z.string().min(1).max(50).default("general"),
});

const buyRecordInput = z.object({
  portfolioItemId: z.number().int(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  price: z.number(),
  amount: z.number().int(),
  shares: z.number(),
  exchangeRate: z.number().optional(),
  memo: z.string().max(200).optional(),
});

// 야후파이낸스 현재가 조회
async function fetchCurrentPrice(ticker: string, currency: 'KRW' | 'USD'): Promise<{
  price: number; change: number; changePercent: number; currency: string;
} | null> {
  try {
    const yahooTicker = currency === 'KRW' ? `${ticker}.KS` : ticker;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=2d`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 8000,
    });
    const result = res.data?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    const price = meta.regularMarketPrice ?? meta.previousClose ?? 0;
    const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
    return { price, change, changePercent, currency: meta.currency || (currency === 'KRW' ? 'KRW' : 'USD') };
  } catch {
    return null;
  }
}

// 환율 조회
async function fetchExchangeRate(): Promise<number> {
  try {
    const res = await axios.get(
      'https://query1.finance.yahoo.com/v8/finance/chart/USDKRW=X?interval=1d&range=1d',
      { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 }
    );
    const price = res.data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return price ?? 1380;
  } catch {
    return 1380;
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    signup: publicProcedure
      .input(signupInput)
      .mutation(async ({ ctx, input }) => {
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "이미 가입된 이메일입니다." });
        }

        const passwordHash = await hashPassword(input.password);
        const openId = `email:${input.email}`;

        await upsertUser({
          openId,
          name: input.name,
          email: input.email,
          passwordHash,
          loginMethod: "email",
          lastSignedIn: new Date(),
        });

        const sessionToken = await sdk.createSessionToken(openId, {
          name: input.name,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        (ctx.res as any).cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true } as const;
      }),
    login: publicProcedure
      .input(authInput)
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        const valid = await verifyPassword(input.password, user?.passwordHash ?? null);

        if (!user || !valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "이메일 또는 비밀번호가 올바르지 않습니다." });
        }

        await upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        (ctx.res as any).cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      (ctx.res as any).clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  portfolio: router({
    list: protectedProcedure.query(({ ctx }) =>
      getPortfolioItems(ctx.user.id)
    ),
    create: protectedProcedure
      .input(portfolioItemInput)
      .mutation(async ({ ctx, input }) => {
        const id = await createPortfolioItem({ ...input, userId: ctx.user.id });
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number().int(), data: portfolioItemInput.partial() }))
      .mutation(({ ctx, input }) =>
        updatePortfolioItem(input.id, ctx.user.id, input.data)
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(({ ctx, input }) =>
        deletePortfolioItem(input.id, ctx.user.id)
      ),
  }),

  buyRecord: router({
    list: protectedProcedure
      .input(z.object({ portfolioItemId: z.number().int().optional() }))
      .query(({ ctx, input }) =>
        getBuyRecords(ctx.user.id, input.portfolioItemId)
      ),
    lastDate: protectedProcedure
      .input(z.object({ portfolioItemId: z.number().int() }))
      .query(({ ctx, input }) =>
        getLastBuyRecordDate(ctx.user.id, input.portfolioItemId)
      ),
    createBatch: protectedProcedure
      .input(z.array(buyRecordInput))
      .mutation(async ({ ctx, input }) => {
        const records = input.map(r => ({ ...r, userId: ctx.user.id }));
        await createBuyRecords(records);
        return { count: records.length };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(({ ctx, input }) =>
        deleteBuyRecord(input.id, ctx.user.id)
      ),
  }),

  market: router({
    prices: publicProcedure
      .input(z.array(z.object({
        ticker: z.string(),
        currency: z.enum(["KRW", "USD"]),
      })))
      .query(async ({ input }) => {
        const results = await Promise.allSettled(
          input.map(async ({ ticker, currency }) => ({
            ticker,
            data: await fetchCurrentPrice(ticker, currency),
          }))
        );
        const priceMap: Record<string, { price: number; change: number; changePercent: number; currency: string } | null> = {};
        results.forEach(r => {
          if (r.status === 'fulfilled') priceMap[r.value.ticker] = r.value.data;
        });
        return priceMap;
      }),
    exchangeRate: publicProcedure.query(async () => {
      const rate = await fetchExchangeRate();
      return { rate };
    }),
  }),

  snapshot: router({
    save: protectedProcedure
      .input(z.object({
        totalKRW: z.number(),
        totalInvestedKRW: z.number(),
        items: z.array(z.object({
          ticker: z.string(),
          valueKRW: z.number(),
          gainPercent: z.number(),
        })),
      }))
      .mutation(({ ctx, input }) =>
        saveSnapshot(ctx.user.id, input)
      ),
    list: protectedProcedure
      .input(z.object({ days: z.number().int().min(7).max(365).default(90) }))
      .query(({ ctx, input }) =>
        getSnapshots(ctx.user.id, input.days)
      ),
  }),

  ai: router({
    diagnose: protectedProcedure
      .input(z.object({
        portfolio: z.array(z.object({
          ticker: z.string(),
          name: z.string(),
          sector: z.string(),
          currency: z.string(),
          avgCost: z.number(),
          shares: z.number(),
          currentPrice: z.number().optional(),
          gainPercent: z.number().optional(),
          valueKRW: z.number().optional(),
          weight: z.number().optional(),
        })),
        totalValueKRW: z.number(),
      }))
      .mutation(async ({ input }) => {
        const portfolioText = input.portfolio.map(p =>
          `- ${p.ticker} (${p.name}): 섹터=${p.sector}, 평단가=${p.avgCost}${p.currency === 'USD' ? 'USD' : '원'}, 수량=${p.shares}, 현재수익률=${p.gainPercent?.toFixed(1) ?? 'N/A'}%, 비중=${p.weight?.toFixed(1) ?? 'N/A'}%`
        ).join('\n');

        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `당신은 한국의 전문 투자 어드바이저입니다. 사용자의 포트폴리오를 분석하고 구체적이고 실용적인 조언을 한국어로 제공합니다. 
              분석 시 다음을 포함하세요:
              1. 포트폴리오 강점 (2-3가지)
              2. 리스크 요인 및 개선점 (2-3가지)
              3. 섹터 집중도 분석
              4. 구체적인 리밸런싱 제안
              5. 국내주식 추가 투자 의견
              응답은 마크다운 형식으로 작성하되, 간결하고 실용적으로 작성하세요 (500자 이내).`,
            },
            {
              role: 'user',
              content: `내 포트폴리오 현황 (총 평가금액: ${(input.totalValueKRW / 10000).toFixed(0)}만원):\n${portfolioText}\n\n이 포트폴리오를 분석하고 투자 조언을 해주세요.`,
            },
          ],
        });
        return { analysis: response.choices[0]?.message?.content ?? '분석 결과를 가져올 수 없습니다.' };
      }),
  }),

  // ── 원금기록장 ─────────────────────────────────────────────────────────────
  principal: router({
    list: protectedProcedure.query(({ ctx }) =>
      getPrincipalRecords(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        accountType: z.string().min(1).max(50),
        amount: z.number().int().min(1),
        memo: z.string().max(200).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createPrincipalRecord({ ...input, userId: ctx.user.id });
        return { id };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(({ ctx, input }) =>
        deletePrincipalRecord(input.id, ctx.user.id)
      ),
  }),

  // ── 외화내역 ──────────────────────────────────────────────────────────────
  fx: router({
    list: protectedProcedure.query(({ ctx }) =>
      getFxRecords(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        type: z.enum(["buy", "sell"]),
        exchangeRate: z.number().min(0),
        usdAmount: z.number().min(0),
        krwAmount: z.number().int().min(0),
        memo: z.string().max(200).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createFxRecord({ ...input, userId: ctx.user.id });
        return { id };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(({ ctx, input }) =>
        deleteFxRecord(input.id, ctx.user.id)
      ),
  }),

  // ── 실현손익 ──────────────────────────────────────────────────────────────
  realizedGain: router({
    list: protectedProcedure
      .input(z.object({ market: z.enum(["kr", "us"]).optional() }))
      .query(({ ctx, input }) =>
        getRealizedGains(ctx.user.id, input.market)
      ),
    create: protectedProcedure
      .input(z.object({
        market: z.enum(["kr", "us"]),
        buyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        sellDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        ticker: z.string().max(20).optional(),
        name: z.string().min(1).max(100),
        buyPrice: z.number().min(0),
        sellPrice: z.number().min(0),
        shares: z.number().min(0),
        dividendTotal: z.number().min(0).default(0),
        currency: z.enum(["KRW", "USD"]).default("KRW"),
        memo: z.string().max(200).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createRealizedGain({ ...input, userId: ctx.user.id });
        return { id };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(({ ctx, input }) =>
        deleteRealizedGain(input.id, ctx.user.id)
      ),
  }),
});

export type AppRouter = typeof appRouter;
