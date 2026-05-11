import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, double, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 포트폴리오 종목 테이블
export const portfolioItems = mysqlTable("portfolio_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ticker: varchar("ticker", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  nameKr: varchar("nameKr", { length: 100 }),
  type: mysqlEnum("type", ["us-stock", "kr-stock", "etf", "commodity"]).notNull().default("us-stock"),
  currency: mysqlEnum("currency", ["KRW", "USD"]).notNull().default("USD"),
  avgCost: double("avgCost").notNull().default(0),
  shares: double("shares").notNull().default(0),
  buyAmount: int("buyAmount").notNull().default(1000),
  buyFrequency: mysqlEnum("buyFrequency", ["daily", "weekly", "monthly"]).notNull().default("daily"),
  sector: varchar("sector", { length: 100 }),
  memo: text("memo"),
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
  amount: int("amount").notNull(), // 매수금액(원)
  shares: double("shares").notNull(),
  exchangeRate: double("exchangeRate"),
  memo: varchar("memo", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BuyRecord = typeof buyRecords.$inferSelect;
export type InsertBuyRecord = typeof buyRecords.$inferInsert;

// 포트폴리오 스냅샷 테이블 (자산 성장 추적용)
export const portfolioSnapshots = mysqlTable("portfolio_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD (하루 1건)
  totalKRW: double("totalKRW").notNull(),           // 총 평가금액 (원화)
  totalInvestedKRW: double("totalInvestedKRW").notNull(), // 총 투자금액 (원화)
  items: json("items").notNull(),                   // 종목별 상세 스냅샷
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortfolioSnapshot = typeof portfolioSnapshots.$inferSelect;
export type InsertPortfolioSnapshot = typeof portfolioSnapshots.$inferInsert;
