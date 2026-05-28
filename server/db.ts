import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

// ── Portfolio Items ──────────────────────────────────────────────────────────

import { and } from "drizzle-orm";
import {
  portfolioItems, InsertPortfolioItem,
  buyRecords, InsertBuyRecord,
} from "../drizzle/schema";

export async function getPortfolioItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolioItems).where(eq(portfolioItems.userId, userId));
}

export async function createPortfolioItem(data: InsertPortfolioItem) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(portfolioItems).values(data);
  return result.insertId as number;
}

export async function updatePortfolioItem(
  id: number,
  userId: number,
  data: Partial<Omit<InsertPortfolioItem, "id" | "userId" | "createdAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(portfolioItems)
    .set(data)
    .where(and(eq(portfolioItems.id, id), eq(portfolioItems.userId, userId)));
}

export async function deletePortfolioItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // 연관 매수기록도 함께 삭제
  await db.delete(buyRecords).where(
    and(eq(buyRecords.portfolioItemId, id), eq(buyRecords.userId, userId))
  );
  await db.delete(portfolioItems).where(
    and(eq(portfolioItems.id, id), eq(portfolioItems.userId, userId))
  );
}

// ── Buy Records ──────────────────────────────────────────────────────────────

export async function getBuyRecords(userId: number, portfolioItemId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (portfolioItemId !== undefined) {
    return db.select().from(buyRecords).where(
      and(eq(buyRecords.userId, userId), eq(buyRecords.portfolioItemId, portfolioItemId))
    );
  }
  return db.select().from(buyRecords).where(eq(buyRecords.userId, userId));
}

export async function createBuyRecords(records: InsertBuyRecord[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (records.length === 0) return;
  await db.insert(buyRecords).values(records);
}

export async function deleteBuyRecord(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(buyRecords).where(
    and(eq(buyRecords.id, id), eq(buyRecords.userId, userId))
  );
}

export async function getLastBuyRecordDate(userId: number, portfolioItemId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ date: buyRecords.date })
    .from(buyRecords)
    .where(and(eq(buyRecords.userId, userId), eq(buyRecords.portfolioItemId, portfolioItemId)))
    .orderBy(buyRecords.date);
  if (rows.length === 0) return null;
  return rows[rows.length - 1].date;
}

// ── Portfolio Snapshots ───────────────────────────────────────────────────────

import { gte, desc } from "drizzle-orm";
import { portfolioSnapshots } from "../drizzle/schema";

export async function saveSnapshot(
  userId: number,
  data: {
    totalKRW: number;
    totalInvestedKRW: number;
    items: Array<{ ticker: string; valueKRW: number; gainPercent: number }>;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const today = new Date().toISOString().slice(0, 10);
  // 오늘 이미 저장된 스냅샷이 있으면 업데이트
  const existing = await db.select({ id: portfolioSnapshots.id })
    .from(portfolioSnapshots)
    .where(and(eq(portfolioSnapshots.userId, userId), eq(portfolioSnapshots.date, today)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(portfolioSnapshots)
      .set({ totalKRW: data.totalKRW, totalInvestedKRW: data.totalInvestedKRW, items: data.items })
      .where(and(eq(portfolioSnapshots.userId, userId), eq(portfolioSnapshots.date, today)));
  } else {
    await db.insert(portfolioSnapshots).values({
      userId,
      date: today,
      totalKRW: data.totalKRW,
      totalInvestedKRW: data.totalInvestedKRW,
      items: data.items,
    });
  }
}

export async function getSnapshots(userId: number, days: number) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);
  return db.select()
    .from(portfolioSnapshots)
    .where(and(eq(portfolioSnapshots.userId, userId), gte(portfolioSnapshots.date, sinceStr)))
    .orderBy(portfolioSnapshots.date);
}

// ── Principal Records (원금기록장) ────────────────────────────────────────────

import {
  principalRecords, InsertPrincipalRecord,
  fxRecords, InsertFxRecord,
  realizedGains, InsertRealizedGain,
} from "../drizzle/schema";

export async function getPrincipalRecords(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(principalRecords)
    .where(eq(principalRecords.userId, userId))
    .orderBy(principalRecords.date);
}

export async function createPrincipalRecord(data: InsertPrincipalRecord) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(principalRecords).values(data);
  return result.insertId as number;
}

export async function deletePrincipalRecord(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(principalRecords).where(
    and(eq(principalRecords.id, id), eq(principalRecords.userId, userId))
  );
}

// ── FX Records (외화내역) ─────────────────────────────────────────────────────

export async function getFxRecords(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fxRecords)
    .where(eq(fxRecords.userId, userId))
    .orderBy(fxRecords.date);
}

export async function createFxRecord(data: InsertFxRecord) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(fxRecords).values(data);
  return result.insertId as number;
}

export async function deleteFxRecord(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(fxRecords).where(
    and(eq(fxRecords.id, id), eq(fxRecords.userId, userId))
  );
}

// ── Realized Gains (실현손익) ─────────────────────────────────────────────────

export async function getRealizedGains(userId: number, market?: "kr" | "us") {
  const db = await getDb();
  if (!db) return [];
  if (market) {
    return db.select().from(realizedGains)
      .where(and(eq(realizedGains.userId, userId), eq(realizedGains.market, market)))
      .orderBy(realizedGains.sellDate);
  }
  return db.select().from(realizedGains)
    .where(eq(realizedGains.userId, userId))
    .orderBy(realizedGains.sellDate);
}

export async function createRealizedGain(data: InsertRealizedGain) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(realizedGains).values(data);
  return result.insertId as number;
}

export async function deleteRealizedGain(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(realizedGains).where(
    and(eq(realizedGains.id, id), eq(realizedGains.userId, userId))
  );
}
