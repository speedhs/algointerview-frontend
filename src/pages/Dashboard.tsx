import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import DecorativeImage from "@/components/DecorativeImage";

interface TeamMember {
  id: string;
  name: string;
  googleLink: string;
  connected: boolean;
}

interface AvailabilityBlock {
  id: string;
  memberId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

const Dashboard = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [newMember, setNewMember] = useState({ name: "", googleLink: "" });
  const [newBlock, setNewBlock] = useState({
    memberId: "",
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "17:00",
  });

  const addMember = () => {
    if (!newMember.name || !newMember.googleLink) {
      toast.error("Please fill in all fields");
      return;
    }

    const member: TeamMember = {
      id: Date.now().toString(),
      name: newMember.name,
      googleLink: newMember.googleLink,
      connected: false,
    };

    setMembers([...members, member]);
    setNewMember({ name: "", googleLink: "" });
    toast.success("Team member added successfully");
  };

  const connectOAuth = (memberId: string) => {
    // Open OAuth flow in new window
    const authUrl = `/api/auth/google/login?member_id=${memberId}`;
    window.open(authUrl, "_blank", "width=600,height=700");
    toast.info("OAuth window opened");
  };

  const addAvailability = () => {
    if (!newBlock.memberId) {
      toast.error("Please select a team member");
      return;
    }

    const block: AvailabilityBlock = {
      id: Date.now().toString(),
      ...newBlock,
    };

    setAvailability([...availability, block]);
    toast.success("Availability block added");
  };

  return (
    <div className="min-h-screen">
      <header className="hero-bg border-b border-border/40 backdrop-blur-xl bg-card/30">
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">Scheduler</h1>
              <p className="text-muted-foreground">Manage your team with grace</p>
            </div>
            <Button variant="outline" size="sm" className="backdrop-blur-sm border-primary/30 hover:border-primary/50">
              <Calendar className="mr-2 h-4 w-4" />
              View Bookings
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 relative">
        <DecorativeImage variant="figure" className="top-20 right-0 w-64 opacity-10" />
        <DecorativeImage variant="rose" className="bottom-20 left-0 w-48 opacity-10" />
        <div className="grid gap-8 lg:grid-cols-2 relative z-10">
          {/* Team Members Section */}
          <Card className="dreamy-card shadow-dreamy border-border/40 transition-all duration-500 hover:shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>Add and manage your team members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="google-link">Google Calendar Link</Label>
                  <Input
                    id="google-link"
                    placeholder="https://calendar.google.com/..."
                    value={newMember.googleLink}
                    onChange={(e) => setNewMember({ ...newMember, googleLink: e.target.value })}
                  />
                </div>
                <Button onClick={addMember} className="w-full shadow-soft hover:shadow-dreamy transition-all duration-500">
                  Add Member
                </Button>
              </div>

              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-2xl border border-border/40 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-4 transition-all duration-300 hover:shadow-soft"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{member.googleLink}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={member.connected ? "outline" : "default"}
                      onClick={() => connectOAuth(member.id)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {member.connected ? "Connected" : "Connect"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Availability Section */}
          <Card className="dreamy-card shadow-dreamy border-border/40 transition-all duration-500 hover:shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Availability
              </CardTitle>
              <CardDescription>Set availability blocks for team members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="member">Team Member</Label>
                  <select
                    id="member"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={newBlock.memberId}
                    onChange={(e) => setNewBlock({ ...newBlock, memberId: e.target.value })}
                  >
                    <option value="">Select member</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="day">Day of Week</Label>
                  <select
                    id="day"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={newBlock.dayOfWeek}
                    onChange={(e) => setNewBlock({ ...newBlock, dayOfWeek: e.target.value })}
                  >
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start">Start Time</Label>
                    <Input
                      id="start"
                      type="time"
                      value={newBlock.startTime}
                      onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end">End Time</Label>
                    <Input
                      id="end"
                      type="time"
                      value={newBlock.endTime}
                      onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={addAvailability} className="w-full shadow-soft hover:shadow-dreamy transition-all duration-500">
                  Add Availability
                </Button>
              </div>

              <div className="space-y-3">
                {availability.map((block) => {
                  const member = members.find((m) => m.id === block.memberId);
                  return (
                    <div
                      key={block.id}
                      className="rounded-2xl border border-border/40 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-4 transition-all duration-300 hover:shadow-soft"
                    >
                      <p className="font-medium">{member?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {block.dayOfWeek}: {block.startTime} - {block.endTime}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
