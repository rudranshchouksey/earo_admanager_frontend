import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DirectionProvider } from "@/contexts/DirectionContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import AdsLibrary from "./pages/AdsLibrary";
import AdCreator from "./pages/AdCreator";
import CampaignsList from "./pages/CampaignsList";
import CampaignWizard from "./pages/CampaignWizard";
import Reports from "./pages/Reports";
import Account from "./pages/Account";
import ResetPassword from "./pages/ResetPassword";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import VerifyEmail from "./pages/VerifyEmail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
     <DirectionProvider>
       <TranslationProvider>
         <TooltipProvider>
           <Toaster />
           <Sonner />
           <BrowserRouter>
             <Routes>
               <Route path="/" element={<Auth />} />
               <Route path="/login" element={<Auth />} />
               <Route path="/verifyEmail" element={<VerifyEmail />} />
               <Route path="/dashboard" element={<Dashboard />}>
                 <Route index element={<DashboardHome />} />
                 <Route path="ads" element={<AdsLibrary />} />
                 <Route path="ads/new" element={<AdCreator />} />
                 <Route path="ads/:id" element={<AdCreator />} />
                  <Route path="campaigns" element={<CampaignsList />} />
                  <Route path="campaigns/new" element={<CampaignWizard />} />
                  <Route path="campaigns/:id" element={<CampaignWizard />} />
                  <Route path="reports" element={<Reports />} />
                 <Route path="account" element={<Account />} />
               </Route>
               <Route path="paymentSuccess" element={<PaymentSuccess />} />
               <Route path="paymentFailed" element={<PaymentFailed />} />
              <Route path="/resetPassword" element={<ResetPassword />} />
              <Route path="/resetPassword/:token" element={<ResetPassword />} />
               <Route path="*" element={<Auth />} />
             </Routes>
           </BrowserRouter>
         </TooltipProvider>
        </TranslationProvider>
     </DirectionProvider>
  </QueryClientProvider>
);

export default App;
