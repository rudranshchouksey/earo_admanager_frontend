import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PaymentFailed() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md text-center shadow-sm">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" aria-hidden />
          </div>
          <CardTitle className="text-xl">Payment unsuccessful</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Something went wrong with your payment. Please try again or contact support if the
            problem continues.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center pb-6">
          <Button className="min-w-[200px]" variant="outline" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
