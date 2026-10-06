import { Navigate, useSearchParams } from "react-router-dom";

// /dashboard/account and /dashboard/billing have no page of their own; the sidebar
// links straight to a section. This also keeps the legacy ?page=billing and
// ?page=advertisers deep links working. A bare ?message= comes only from the
// backend's add-card return (Api_Gateway wallet-billing controller), so it lands on
// Payment method, where Account toasts it next to the card list. Other query params
// are forwarded. Account redirects again if the role can't open the target section.
export default function AccountRedirect({ to }: { to: string }) {
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page");
  const target =
    page === "billing" || (!page && searchParams.has("message"))
      ? "/dashboard/billing/payment-method"
      : page === "advertisers"
        ? "/dashboard/account/advertisers"
        : to;

  const rest = new URLSearchParams(searchParams);
  rest.delete("page");
  const query = rest.toString();

  return <Navigate to={query ? `${target}?${query}` : target} replace />;
}
