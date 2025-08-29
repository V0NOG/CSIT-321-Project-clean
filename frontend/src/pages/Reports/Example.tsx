import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/reports/students";

export default function Example() {
  return (
    <>
      <PageMeta
        title="CSIT-321 | Example"
        description="Example for CSIT-321"
      />
      <PageBreadcrumb pageTitle="Example List" />
      <div className="space-y-6">
          <BasicTableOne />
      </div>
    </>
  );
}