// Home page: the published CMS page "home", plus the church's structured data.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { getGlobal, getMediaByIds, getPublishedPage } from "@/cms/queries";
import { PageSections, pageMetadata } from "@/cms/render";
import { churchJsonLd, JsonLd } from "@/lib/seo/jsonld";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPublishedPage("home"), "/");
}

export default async function HomePage() {
  const [page, site, navbar] = await Promise.all([getPublishedPage("home"), getGlobal("site"), getGlobal("navbar")]);
  if (!page) notFound();
  const logoId = navbar.logoImage?.mediaId;
  const logo = logoId ? (await getMediaByIds([logoId]))[logoId] : undefined;
  return (
    <div className={styles.container}>
      <JsonLd data={churchJsonLd(site, { logoUrl: logo?.url })} />
      <PageSections page={page} />
    </div>
  );
}
