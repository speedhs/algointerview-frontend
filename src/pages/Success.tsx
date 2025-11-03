import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Calendar, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Success = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full dreamy-card shadow-elevated border-border/40">
        <CardHeader className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-secondary/30 to-primary/30 backdrop-blur-sm flex items-center justify-center shadow-dreamy animate-scale-in">
            <CheckCircle2 className="h-12 w-12 text-secondary" />
          </div>
          <CardTitle className="text-4xl text-gradient">Booking Confirmed!</CardTitle>
          <CardDescription className="text-base">
            Your meeting has been successfully scheduled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-border/40 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-4 transition-all duration-300 hover:shadow-soft">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Calendar Invite Sent</p>
                <p className="text-sm text-muted-foreground">
                  You'll receive a calendar invitation shortly
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-border/40 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-4 transition-all duration-300 hover:shadow-soft">
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
              className="w-full shadow-dreamy hover:shadow-elevated transition-all duration-500"
              onClick={() => navigate("/")}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full border-border/40 hover:border-primary/50 transition-all duration-300"
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
