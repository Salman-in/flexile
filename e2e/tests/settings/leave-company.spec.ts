import { db } from "@test/db";
import { companiesFactory } from "@test/factories/companies";
import { companyContractorsFactory } from "@test/factories/companyContractors";
import { companyInvestorsFactory } from "@test/factories/companyInvestors";
import { companyLawyersFactory } from "@test/factories/companyLawyers";
import { usersFactory } from "@test/factories/users";
import { login } from "@test/helpers/auth";
import { expect, test } from "@test/index";
import { and, eq } from "drizzle-orm";
import { companyContractors, companyInvestors, companyLawyers } from "@/db/schema";

test.describe("Leave company", () => {
  test("administrator cannot see leave workspace option", async ({ page }) => {
    const { adminUser } = await companiesFactory.createCompletedOnboarding();
    await login(page, adminUser);

    await page.getByRole("link", { name: "Settings" }).click();

    await expect(page.getByText("Leave workspace")).not.toBeVisible();
  });

  test("contractor can leave successfully", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();

    await companyContractorsFactory.create({
      companyId: company.id,
      userId: user.id,
    });

    await login(page, user);
    await page.getByRole("link", { name: "Settings" }).click();

    await page.getByRole("button", { name: "Leave workspace" }).click();

    await expect(page.getByText("Leave this workspace?")).toBeVisible();
    await page.getByRole("button", { name: "Leave" }).click();

    await expect(page).toHaveURL("/invoices");

    const contractor = await db.query.companyContractors.findFirst({
      where: and(eq(companyContractors.companyId, company.id), eq(companyContractors.userId, user.id)),
    });
    expect(contractor?.endedAt).toBeTruthy();
  });

  test("investor can leave successfully", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();

    // Create a second company where the user is also an investor
    const { company: secondCompany } = await companiesFactory.createCompletedOnboarding();

    await companyInvestorsFactory.create({
      companyId: company.id,
      userId: user.id,
    });

    await companyInvestorsFactory.create({
      companyId: secondCompany.id,
      userId: user.id,
    });

    await login(page, user);
    await page.getByRole("link", { name: "Settings" }).click();

    await page.getByRole("button", { name: "Leave workspace" }).click();

    await expect(page.getByText("Leave this workspace?")).toBeVisible();
    await page.getByRole("button", { name: "Leave" }).click();

    await expect(page).toHaveURL("/equity/dividends");

    const investor = await db.query.companyInvestors.findFirst({
      where: and(eq(companyInvestors.companyId, company.id), eq(companyInvestors.userId, user.id)),
    });
    expect(investor).toBeUndefined();

    // Should still be investor in second company
    const remainingInvestor = await db.query.companyInvestors.findFirst({
      where: and(eq(companyInvestors.companyId, secondCompany.id), eq(companyInvestors.userId, user.id)),
    });
    expect(remainingInvestor).toBeDefined();
  });

  test("lawyer can leave successfully", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();

    // Create a second company where the user is also a lawyer
    const { company: secondCompany } = await companiesFactory.createCompletedOnboarding();

    await companyLawyersFactory.create({
      companyId: company.id,
      userId: user.id,
    });

    await companyLawyersFactory.create({
      companyId: secondCompany.id,
      userId: user.id,
    });

    await login(page, user);
    await page.getByRole("link", { name: "Settings" }).click();

    await page.getByRole("button", { name: "Leave workspace" }).click();

    await expect(page.getByText("Leave this workspace?")).toBeVisible();
    await page.getByRole("button", { name: "Leave" }).click();

    await expect(page).toHaveURL("/documents");

    const lawyer = await db.query.companyLawyers.findFirst({
      where: and(eq(companyLawyers.companyId, company.id), eq(companyLawyers.userId, user.id)),
    });
    expect(lawyer).toBeUndefined();

    // Should still be lawyer in second company
    const remainingLawyer = await db.query.companyLawyers.findFirst({
      where: and(eq(companyLawyers.companyId, secondCompany.id), eq(companyLawyers.userId, user.id)),
    });
    expect(remainingLawyer).toBeDefined();
  });

  test("user with multiple roles can leave successfully", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();

    await companyContractorsFactory.create({
      companyId: company.id,
      userId: user.id,
    });

    await companyInvestorsFactory.create({
      companyId: company.id,
      userId: user.id,
    });

    await login(page, user);
    await page.getByRole("link", { name: "Settings" }).click();

    await page.getByRole("button", { name: "Leave workspace" }).click();

    await expect(page.getByText("Leave this workspace?")).toBeVisible();
    await page.getByRole("button", { name: "Leave" }).click();

    await expect(page).toHaveURL("/invoices");

    const contractor = await db.query.companyContractors.findFirst({
      where: and(eq(companyContractors.companyId, company.id), eq(companyContractors.userId, user.id)),
    });
    const investor = await db.query.companyInvestors.findFirst({
      where: and(eq(companyInvestors.companyId, company.id), eq(companyInvestors.userId, user.id)),
    });

    expect(contractor?.endedAt).toBeTruthy();
    expect(investor).toBeUndefined();
  });

  test("user can cancel leaving workspace", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();

    await companyInvestorsFactory.create({
      companyId: company.id,
      userId: user.id,
    });

    await login(page, user);
    await page.getByRole("link", { name: "Settings" }).click();

    await page.getByRole("button", { name: "Leave workspace" }).click();

    await expect(page.getByText("Leave this workspace?")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByText("Leave this workspace?")).not.toBeVisible();

    const investor = await db.query.companyInvestors.findFirst({
      where: and(eq(companyInvestors.companyId, company.id), eq(companyInvestors.userId, user.id)),
    });
    expect(investor).toBeDefined();
  });
});
