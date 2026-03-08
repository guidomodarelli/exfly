import type {
  GetServerSideProps,
  InferGetServerSidePropsType,
} from "next";

import { StoragePlayground } from "@/components/storage-playground/storage-playground";
import type {
  StorageBootstrap,
} from "@/server/storage/get-storage-bootstrap";
import { getStorageBootstrap } from "@/server/storage/get-storage-bootstrap";
import { GOOGLE_OAUTH_SCOPES } from "@/server/auth/google-oauth-scopes";
import { isGoogleOAuthConfigured } from "@/server/auth/google-oauth-config";

import styles from "./index.module.scss";

type HomePageProps = {
  bootstrap: StorageBootstrap;
};

export default function HomePage({
  bootstrap,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const isOAuthConfigured = bootstrap.authStatus === "configured";

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <StoragePlayground isOAuthConfigured={isOAuthConfigured} />
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async () => {
  try {
    return {
      props: {
        bootstrap: getStorageBootstrap({
          isGoogleOAuthConfigured: isGoogleOAuthConfigured(),
          requiredScopes: GOOGLE_OAUTH_SCOPES,
        }),
      },
    };
  } catch {
    return {
      props: {
        bootstrap: getStorageBootstrap({
          isGoogleOAuthConfigured: false,
          requiredScopes: [],
        }),
      },
    };
  }
};
