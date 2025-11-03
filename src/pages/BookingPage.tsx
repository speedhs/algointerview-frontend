import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, User } from "lucide-react";
import { toast } from "sonner";

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  date: string;
}

const BookingPage = () => {
  const { team_id } = useParams();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch available slots from backend
    fetchAvailableSlots();
  }, [team_id]);

  const fetchAvailableSlots = async () => {
    // Mock data - replace with actual API call
    // GET /api/book/${team_id}/slots
    const mockSlots: TimeSlot[] = [
      { id: "1", date: "2025-11-04", start: "09:00", end: "10:00" },
      { id: "2", date: "2025-11-04", start: "10:00", end: "11:00" },
      { id: "3", date: "2025-11-04", start: "14:00", end: "15:00" },
      { id: "4", date: "2025-11-05", start: "09:00", end: "10:00" },
      { id: "5", date: "2025-11-05", start: "11:00", end: "12:00" },
    ];
    setSlots(mockSlots);
  };

  const handleBooking = async () => {
    if (!selectedSlot || !guestInfo.name || !guestInfo.email) {
      toast.error("Please fill in all fields and select a time slot");
      return;
    }

    setLoading(true);

    try {
      // POST to /book/${team_id}/reserve
      const response = await fetch(`/api/book/${team_id}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id: selectedSlot,
          guest_name: guestInfo.name,
          guest_email: guestInfo.email,
        }),
      });

      if (response.ok) {
        toast.success("Booking confirmed!");
        navigate("/success");
      } else {
        toast.error("Booking failed. Please try again.");
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Book a Meeting</h1>
            <p className="text-muted-foreground mt-1">Select your preferred time slot</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Available Slots */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Available Time Slots
              </CardTitle>
              <CardDescription>Choose a time that works for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                <div key={date} className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {dateSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={selectedSlot === slot.id ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => setSelectedSlot(slot.id)}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {slot.start}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Guest Information */}
          <Card className="shadow-lg">
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
              </div>

              {selectedSlot && (
                <div className="rounded-lg border bg-muted/50 p-4">
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
                disabled={loading || !selectedSlot}
                className="w-full"
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
