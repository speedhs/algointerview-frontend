import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Calendar, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Success = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-secondary" />
          </div>
          <CardTitle className="text-3xl">Booking Confirmed!</CardTitle>
          <CardDescription className="text-base">
            Your meeting has been successfully scheduled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Calendar Invite Sent</p>
                <p className="text-sm text-muted-foreground">
                  You'll receive a calendar invitation shortly
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Confirmation Email</p>
                <p className="text-sm text-muted-foreground">
                  Check your inbox for meeting details
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              variant="default"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Book Another Meeting
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Success;
