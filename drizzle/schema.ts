import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, double, json, date as mysqlDate } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 포트폴리오 종목 테이블 (계좌 유형 추가)
export const portfolioItems = mysqlTable("portfolio_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ticker: varchar("ticker", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  nameKr: varchar("nameKr", { length: 100 }),
  type: mysqlEnum("type", ["us-stock", "kr-stock", "etf", "commodity", "savings", "note"]).notNull().default("us-stock"),
  currency: mysqlEnum("currency", ["KRW", "USD"]).notNull().default("USD"),
  avgCost: double("avgCost").notNull().default(0),
  shares: double("shares").notNull().default(0),
  buyAmount: int("buyAmount").notNull().default(1000),
  buyFrequency: mysqlEnum("buyFrequency", ["daily", "weekly", "monthly"]).notNull().default("daily"),
  sector: varchar("sector", { length: 100 }),
  memo: text("memo"),
  // 적금/발행어음 관련 필드
  maturityDate: varchar("maturityDate", { length: 10 }), // 만기일 YYYY-MM-DD
  interestRate: double("interestRate"),                // 이율 (%)
  // 계좌 유형 (자유 입력 가능하도록 varchar로 변경)
  accountType: varchar("accountType", { length: 50 }).notNull().default("general"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = typeof portfolioItems.$inferInsert;

// 매수 기록 테이블
export const buyRecords = mysqlTable("buy_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  portfolioItemId: int("portfolioItemId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  price: double("price").notNull(),
  amount: int("amount").notNull(),
  shares: double("shares").notNull(),
  exchangeRate: double("exchangeRate"),
  memo: varchar("memo", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BuyRecord = typeof buyRecords.$inferSelect;
export type InsertBuyRecord = typeof buyRecords.$inferInsert;

// 포트폴리오 스냅샷 테이블
export const portfolioSnapshots = mysqlTable("portfolio_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  totalKRW: double("totalKRW").notNull(),
  totalInvestedKRW: double("totalInvestedKRW").notNull(),
  items: json("items").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortfolioSnapshot = typeof portfolioSnapshots.$inferSelect;
export type InsertPortfolioSnapshot = typeof portfolioSnapshots.$inferInsert;

// 원금기록장 테이블 (날짜별 계좌별 입금액)
export const principalRecords = mysqlTable("principal_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  accountType: varchar("accountType", { length: 50 }).notNull(),
  amount: int("amount").notNull(), // 입금액 (원)
  memo: varchar("memo", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PrincipalRecord = typeof principalRecords.$inferSelect;
export type InsertPrincipalRecord = typeof principalRecords.$inferInsert;

// 외화내역 테이블 (달러 매수/매도 기록)
export const fxRecords = mysqlTable("fx_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  type: mysqlEnum("type", ["buy", "sell"]).notNull().default("buy"), // 매수/매도
  exchangeRate: double("exchangeRate").notNull(), // 환율
  usdAmount: double("usdAmount").notNull(),       // 달러 금액
  krwAmount: int("krwAmount").notNull(),           // 원화 금액
  memo: varchar("memo", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FxRecord = typeof fxRecords.$inferSelect;
export type InsertFxRecord = typeof fxRecords.$inferInsert;

// 실현손익 테이블 (한국/미국 주식 매도 기록)
export const realizedGains = mysqlTable("realized_gains", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  market: mysqlEnum("market", ["kr", "us"]).notNull().default("kr"), // 한국/미국
  buyDate: varchar("buyDate", { length: 10 }).notNull(),   // 매수일 YYYY-MM-DD
  sellDate: varchar("sellDate", { length: 10 }).notNull(), // 매도일 YYYY-MM-DD
  ticker: varchar("ticker", { length: 20 }),               // 종목코드 (미국)
  name: varchar("name", { length: 100 }).notNull(),        // 종목명
  buyPrice: double("buyPrice").notNull(),                  // 매수단가
  sellPrice: double("sellPrice").notNull(),                // 매도단가
  shares: double("shares").notNull(),                      // 수량
  dividendTotal: double("dividendTotal").notNull().default(0), // 누적 배당금
  currency: mysqlEnum("currency", ["KRW", "USD"]).notNull().default("KRW"),
  memo: varchar("memo", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RealizedGain = typeof realizedGains.$inferSelect;
export type InsertRealizedGain = typeof realizedGains.$inferInsert;
