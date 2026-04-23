import type { GetServerSidePropsContext } from "next";

import { getServerSideProps } from "@/pages/gastos";

function createContext(
  query: GetServerSidePropsContext["query"],
): GetServerSidePropsContext {
  return {
    query,
    req: {} as GetServerSidePropsContext["req"],
    res: {} as GetServerSidePropsContext["res"],
    resolvedUrl: "/gastos",
  } as unknown as GetServerSidePropsContext;
}

describe("Legacy gastos route", () => {
  it("redirects /gastos to /compromisos", async () => {
    const result = await getServerSideProps(createContext({}));

    expect("redirect" in result && result.redirect?.destination).toBe("/compromisos");
    expect(
      "redirect" in result &&
        result.redirect &&
        ("permanent" in result.redirect ? result.redirect.permanent : false),
    ).toBe(false);
  });

  it("preserves query params while redirecting", async () => {
    const result = await getServerSideProps(
      createContext({
        month: "2026-04",
        tab: "expenses",
      }),
    );

    expect("redirect" in result && result.redirect?.destination).toBe(
      "/compromisos?month=2026-04&tab=expenses",
    );
  });

  it("preserves repeated query params while redirecting", async () => {
    const result = await getServerSideProps(
      createContext({
        tag: ["a", "b"],
      }),
    );

    expect("redirect" in result && result.redirect?.destination).toBe(
      "/compromisos?tag=a&tag=b",
    );
  });
});
