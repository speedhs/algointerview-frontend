import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Scheduler Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your team and availability</p>
            </div>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              View Bookings
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Team Members Section */}
          <Card className="shadow-lg">
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
                <Button onClick={addMember} className="w-full">
                  Add Member
                </Button>
              </div>

              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/50 p-4"
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
          <Card className="shadow-lg">
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
                <Button onClick={addAvailability} className="w-full">
                  Add Availability
                </Button>
              </div>

              <div className="space-y-3">
                {availability.map((block) => {
                  const member = members.find((m) => m.id === block.memberId);
                  return (
                    <div
                      key={block.id}
                      className="rounded-lg border bg-muted/50 p-4"
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
