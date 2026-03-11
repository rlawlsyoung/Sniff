import { FeatureDetailPage } from "../../components/feature-detail-page";

type FeaturePageProps = {
  params: Promise<{
    featureId: string;
  }>;
};

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { featureId } = await params;

  return <FeatureDetailPage featureId={featureId} />;
}
