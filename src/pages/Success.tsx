import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Calendar, Mail, Clipboard, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LastBooking {
  startISO: string;
  endISO: string;
  name: string;
  email: string;
  summary: string;
  notes?: string;
}

function formatICSDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

function buildICS(booking: LastBooking): string {
  const dtstamp = formatICSDate(new Date().toISOString());
  const dtstart = formatICSDate(booking.startISO);
  const dtend = formatICSDate(booking.endISO);
  const uid = `${Date.now()}@teamscheduler.local`;
  const descriptionLines = [booking.notes || "", booking.email ? `Attendee: ${booking.email}` : ""].filter(Boolean);
  const description = descriptionLines.join("\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Team Scheduler//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${booking.summary}`,
    description ? `DESCRIPTION:${description}` : undefined,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

const Success = () => {
  const navigate = useNavigate();
  const [booking, setBooking] = useState<LastBooking | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastBooking");
      if (raw) {
        const parsed = JSON.parse(raw) as LastBooking;
        if (parsed && parsed.startISO && parsed.endISO) {
          setBooking(parsed);
        }
      }
    } catch {}
  }, []);

  const copyDetails = async () => {
    if (!booking) return;
    const start = new Date(booking.startISO);
    const end = new Date(booking.endISO);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const lines = [
      `Title: ${booking.summary}`,
      `When: ${start.toLocaleString()} - ${end.toLocaleTimeString()} (${tz})`,
      booking.email ? `Attendee: ${booking.email}` : undefined,
      booking.notes ? `Notes: ${booking.notes}` : undefined,
    ].filter(Boolean) as string[];
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const downloadICS = () => {
    if (!booking) return;
    const ics = buildICS(booking);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meeting.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
          {booking ? (
            <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-4">
              <p className="text-sm font-medium mb-1">Meeting Details</p>
              <p className="text-sm text-muted-foreground">
                {new Date(booking.startISO).toLocaleString()} — {new Date(booking.endISO).toLocaleTimeString()} ({Intl.DateTimeFormat().resolvedOptions().timeZone})
              </p>
              <p className="text-sm text-muted-foreground truncate">{booking.summary}</p>
              {booking.email && <p className="text-sm text-muted-foreground truncate">Attendee: {booking.email}</p>}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground">Booking details unavailable.</div>
          )}
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
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full border-border/40 hover:border-primary/50 transition-all duration-300"
                onClick={downloadICS}
                disabled={!booking}
              >
                <Download className="h-4 w-4 mr-2" />
                Download .ics
              </Button>
              <Button
                variant="outline"
                className="w-full border-border/40 hover:border-primary/50 transition-all duration-300"
                onClick={copyDetails}
                disabled={!booking}
              >
                <Clipboard className="h-4 w-4 mr-2" />
                Copy Details
              </Button>
            </div>
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
