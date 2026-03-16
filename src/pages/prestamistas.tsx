import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";

import MonthlyExpensesPage, {
  type MonthlyExpensesPageProps,
} from "@/modules/monthly-expenses/shared/pages/monthly-expenses-page";

export default function LendersPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return <MonthlyExpensesPage {...props} />;
}

export const getServerSideProps: GetServerSideProps<MonthlyExpensesPageProps> = async (
  context: GetServerSidePropsContext,
) => {
  const { getMonthlyExpensesServerSidePropsForTab } = await import(
    "@/modules/monthly-expenses/infrastructure/pages/monthly-expenses-server-props"
  );

  return getMonthlyExpensesServerSidePropsForTab(context, "lenders");
};
