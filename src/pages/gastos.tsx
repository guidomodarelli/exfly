import type { GetServerSideProps, GetServerSidePropsContext } from "next";

export {
  getReportProviderFilterOptions,
  getRequestedMonthlyExpensesTab,
} from "./compromisos";

export default function LegacyMonthlyExpensesRoutePage() {
  return null;
}

function getCompromisosDestination(context: GetServerSidePropsContext): string {
  const params = new URLSearchParams();

  Object.entries(context.query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((currentValue) => {
        params.append(key, currentValue);
      });
      return;
    }

    if (typeof value === "string") {
      params.append(key, value);
    }
  });

  const serializedParams = params.toString();

  return serializedParams.length > 0
    ? `/compromisos?${serializedParams}`
    : "/compromisos";
}

export const getServerSideProps: GetServerSideProps = async (context) => ({
  redirect: {
    destination: getCompromisosDestination(context),
    permanent: false,
  },
});
