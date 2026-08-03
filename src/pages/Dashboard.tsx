import { Outlet } from 'react-router-dom';
import ProtectedRoute from '@/components/dashboard/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { auth } from '@/services/auth';
import { useEffect } from 'react';
import { userApi } from '@/services/user';
import { Helmet } from 'react-helmet-async';
import { logger } from "@/lib/logger";

/** Re-export for auth page background preview */
export { default as MockDashboardPreview, AuthPageBackground } from '@/components/dashboard/MockDashboardPreview';

export default function Dashboard() {



  useEffect(() => {


    const getProfile = async () => {

      const { data: { session: sessionData } } = await auth.getSession();

      const { data, error , message, status } = await userApi.getUserProfile();
      if(error || status !== 200) return;

      if(data?.data.organizations && data?.data.organizations.length > 0) {
        if(data?.data.organizations[0].orgType === "AGENCY" && !sessionData?.user.app_metadata?.isAgency) {
          logger.info("user is agency but not set in session")
          auth.setOrganizationType("AGENCY");
        }else if(data?.data.organizations[0].orgType === "SME" && sessionData?.user.app_metadata?.isAgency) {
          logger.info("user is SME but set in session agency")
          auth.setOrganizationType("SME");
        }
      }

    };
    getProfile();


  }, []);

  return (
    <>
    
      <Helmet>
        <title>EARO | Dashboard</title>
      </Helmet>
      <ProtectedRoute>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </ProtectedRoute>
    </>
  );
}
