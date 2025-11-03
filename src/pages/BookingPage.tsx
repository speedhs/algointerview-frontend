import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, User, Globe } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface TimeSlot {
  id: string;
  date: string;
  start: string;
  end: string;
  startISO: string;
  endISO: string;
}

const BookingPage = () => {
  const { team_id } = useParams();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!team_id || Number.isNaN(Number(team_id))) {
      setInvalidLink(true);
      return;
    }
    fetchAvailableSlots();
  }, [team_id]);

  const fetchAvailableSlots = async () => {
    setSlotsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/book/${team_id}`);
      if (!res.ok) throw new Error();
      const data: Array<{ id: number; start_time: string; end_time: string } > = await res.json();
      const mapped: TimeSlot[] = data.map((s) => {
        const start = new Date(s.start_time);
        const end = new Date(s.end_time);
        const dateStr = start.toISOString().slice(0, 10);
        const startLabel = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const endLabel = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return {
          id: String(s.id),
          date: dateStr,
          start: startLabel,
          end: endLabel,
          startISO: start.toISOString(),
          endISO: end.toISOString(),
        };
      });
      setSlots(mapped);
    } catch {
      setFetchError("Could not load time slots. Please try again.");
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !guestInfo.name || !guestInfo.email) {
      toast.error("Please fill in all fields and select a time slot");
      return;
    }
    const emailOk = /.+@.+\..+/.test(guestInfo.email);
    if (!emailOk) {
      toast.error("Enter a valid email");
      return;
    }

    setLoading(true);

    try {
      const slot = slots.find((s) => s.id === selectedSlot);
      if (!slot) throw new Error("Invalid slot");
      const response = await fetch(`/api/book/${team_id}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: slot.startISO,
          end_time: slot.endISO,
          attendee_email: guestInfo.email,
          summary: `Booking with ${guestInfo.name}`,
          notes: guestInfo.notes || undefined,
        }),
      });

      if (response.ok) {
        try {
          localStorage.setItem(
            "lastBooking",
            JSON.stringify({
              startISO: slot.startISO,
              endISO: slot.endISO,
              name: guestInfo.name,
              email: guestInfo.email,
              summary: `Booking with ${guestInfo.name}`,
              notes: guestInfo.notes || "",
            }),
          );
        } catch {}
        toast.success("Booking confirmed!");
        navigate("/success");
      } else if (response.status === 409) {
        toast.error("This time is no longer available. Please pick another slot.");
      } else {
        const msg = await response.text();
        toast.error(msg || "Booking failed. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const groupSlotsByDate = () => {
    const grouped: { [key: string]: TimeSlot[] } = {};
    slots.forEach((slot) => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });
    return grouped;
  };

  const groupedSlots = groupSlotsByDate();

  return (
    <div className="min-h-screen">
      <header className="hero-bg border-b border-border/40 backdrop-blur-xl bg-card/30">
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gradient mb-3">Book a Meeting</h1>
            <p className="text-muted-foreground text-lg">Select your preferred time slot</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              Times shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {invalidLink ? (
          <div className="text-center text-sm text-muted-foreground">Invalid booking link.</div>
        ) : null}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Available Slots */}
          <Card className="dreamy-card shadow-dreamy border-border/40 transition-all duration-500 hover:shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Available Time Slots
              </CardTitle>
              <CardDescription>Choose a time that works for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {slotsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6].map((j) => (
                          <Skeleton key={j} className="h-10 w-full" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : fetchError ? (
                <div className="text-center text-sm text-muted-foreground py-6">
                  {fetchError} <button className="underline" onClick={fetchAvailableSlots}>Retry</button>
                </div>
              ) : Object.keys(groupedSlots).length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-6">
                  No available times. Please check back later.
                </div>
              ) : (
                Object.entries(groupedSlots).map(([date, dateSlots]) => (
                  <div key={date} className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {dateSlots.map((slot) => (
                        <Button
                          key={slot.id}
                          variant={selectedSlot === slot.id ? "default" : "outline"}
                          className="justify-start transition-all duration-300 hover:shadow-soft border-border/40"
                          onClick={() => setSelectedSlot(slot.id)}
                          aria-pressed={selectedSlot === slot.id}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {slot.start}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Guest Information */}
          <Card className="dreamy-card shadow-dreamy border-border/40 transition-all duration-500 hover:shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Information
              </CardTitle>
              <CardDescription>Tell us a bit about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="guest-name">Full Name</Label>
                  <Input
                    id="guest-name"
                    placeholder="John Doe"
                    value={guestInfo.name}
                    onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="guest-email">Email Address</Label>
                  <Input
                    id="guest-email"
                    type="email"
                    placeholder="john@example.com"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="guest-notes">Notes (optional)</Label>
                  <Textarea
                    id="guest-notes"
                    placeholder="Anything you'd like us to know"
                    value={guestInfo.notes}
                    onChange={(e) => setGuestInfo({ ...guestInfo, notes: e.target.value })}
                  />
                </div>
              </div>

              {selectedSlot && (
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-sm p-4">
                  <p className="text-sm font-medium mb-2">Selected Time:</p>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      const slot = slots.find((s) => s.id === selectedSlot);
                      if (!slot) return "";
                      return `${new Date(slot.date).toLocaleDateString()} at ${slot.start}`;
                    })()}
                  </p>
                </div>
              )}

              <Button
                onClick={handleBooking}
                disabled={loading || !selectedSlot || !guestInfo.name || !guestInfo.email}
                className="w-full shadow-dreamy hover:shadow-elevated transition-all duration-500"
                size="lg"
              >
                {loading ? "Booking..." : "Confirm Booking"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BookingPage;
