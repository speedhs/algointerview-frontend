import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, ExternalLink, Link as LinkIcon, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DecorativeImage from "@/components/DecorativeImage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TeamMember {
  id: number;
  name: string;
  google_booking_link: string;
  display_email?: string | null;
}

interface AvailabilityBlockForm {
  memberId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface AvailabilityBlock {
  id: string;
  memberId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface Team {
  id: number;
  name: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [teamId, setTeamId] = useState<number | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState({ name: "", googleLink: "" });
  const [newBlock, setNewBlock] = useState<AvailabilityBlockForm>({
    memberId: "",
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "17:00",
  });
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [availabilitySubmitting, setAvailabilitySubmitting] = useState(false);
  const [memberTouched, setMemberTouched] = useState({ name: false, googleLink: false });
  const [availabilityTouched, setAvailabilityTouched] = useState({ memberId: false, startTime: false, endTime: false });
  const [apiStatus, setApiStatus] = useState<"unknown" | "ok" | "down">("unknown");

  const isTeamSelected = teamId !== null;
  const isNewMemberValid = Boolean(newMember.name.trim()) && Boolean(newMember.googleLink.trim());
  const isAvailabilityTimeValid = newBlock.startTime < newBlock.endTime;
  const isAvailabilityValid = Boolean(newBlock.memberId) && Boolean(newBlock.startTime) && Boolean(newBlock.endTime) && isAvailabilityTimeValid;

  const removeTeamLocally = (id: number) => {
    const updated = teams.filter((t) => t.id !== id);
    setTeams(updated);
    localStorage.setItem("teams", JSON.stringify(updated));
    if (teamId === id) {
      setTeamId(null);
      localStorage.removeItem("teamId");
      setMembers([]);
      setAvailability([]);
      setNewMember({ name: "", googleLink: "" });
      setNewBlock({ memberId: "", dayOfWeek: "Monday", startTime: "09:00", endTime: "17:00" });
    }
  };

  const deleteTeam = async () => {
    if (!teamId) {
      toast.error("Select a team first");
      return;
    }
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      removeTeamLocally(teamId);
      toast.success("Team deleted");
    } catch {
      // Fallback: remove locally if server delete is unavailable
      removeTeamLocally(teamId);
      toast.success("Team deleted locally");
    }
  };

  useEffect(() => {
    const initialized = localStorage.getItem("adminSetup") === "true";
    if (!initialized) {
      navigate("/setup", { replace: true });
      return;
    }
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }
    const storedTeamsRaw = localStorage.getItem("teams");
    const storedTeams: Team[] = storedTeamsRaw ? JSON.parse(storedTeamsRaw) : [];
    setTeams(storedTeams);
    const storedTeamId = localStorage.getItem("teamId");
    if (storedTeamId) {
      const id = Number(storedTeamId);
      setTeamId(id);
      void fetchMembers(id);
    }
    // Health check
    let cancelled = false;
    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`/api/health`, { signal: controller.signal });
        clearTimeout(timeout);
        if (cancelled) return;
        setApiStatus(res.ok ? "ok" : "down");
      } catch {
        if (!cancelled) setApiStatus("down");
      }
    };
    checkHealth();
    const id = setInterval(checkHealth, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [navigate]);

  const fetchMembers = async (id: number) => {
    try {
      const res = await fetch(`/api/teams/${id}/members`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMembers(data);
    } catch {
      toast.error("Failed to load members");
    }
  };

  const createTeam = async () => {
    if (!newTeamName) {
      toast.error("Team name is required");
      return;
    }
    try {
      const res = await fetch(`/api/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName }),
      });
      if (!res.ok) throw new Error();
      const tCreated: Team = await res.json();
      const updated = [...teams, tCreated];
      setTeams(updated);
      localStorage.setItem("teams", JSON.stringify(updated));
      setTeamId(tCreated.id);
      localStorage.setItem("teamId", String(tCreated.id));
      setNewTeamName("");
      toast.success("Team created");
    } catch {
      // Fallback: local-only team when backend isn't available
      const localTeam: Team = { id: Date.now(), name: newTeamName };
      const updated = [...teams, localTeam];
      setTeams(updated);
      localStorage.setItem("teams", JSON.stringify(updated));
      setTeamId(localTeam.id);
      localStorage.setItem("teamId", String(localTeam.id));
      setNewTeamName("");
      toast.success("Team created locally");
    }
  };

  const addMember = async () => {
    if (!teamId) {
      toast.error("Team not initialized yet");
      return;
    }
    if (!newMember.name || !newMember.googleLink) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      setMemberSubmitting(true);
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMember.name,
          google_booking_link: newMember.googleLink,
        }),
      });
      if (!res.ok) throw new Error();
      const created: TeamMember = await res.json();
      setMembers((prev) => [...prev, created]);
      setNewMember({ name: "", googleLink: "" });
      toast.success("Team member added successfully");
    } catch {
      toast.error("Failed to add member");
    } finally {
      setMemberSubmitting(false);
    }
  };

  const connectOAuth = (memberId: number) => {
    // Open OAuth flow in new window
    const authUrl = `/api/auth/google/login?member_id=${memberId}`;
    window.open(authUrl, "_blank", "width=600,height=700");
    toast.info("OAuth window opened");
  };

  const addAvailability = async () => {
    if (!teamId) {
      toast.error("Team not initialized yet");
      return;
    }
    if (!newBlock.memberId) {
      toast.error("Please select a team member");
      return;
    }
    try {
      setAvailabilitySubmitting(true);
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const targetIdx = days.indexOf(newBlock.dayOfWeek);
      const now = new Date();
      const currentIdx = now.getDay();
      let addDays = (targetIdx - currentIdx + 7) % 7;
      if (addDays === 0) addDays = 7;
      const date = new Date(now);
      date.setDate(now.getDate() + addDays);
      const [sh, sm] = newBlock.startTime.split(":").map(Number);
      const [eh, em] = newBlock.endTime.split(":").map(Number);
      const start = new Date(date);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(date);
      end.setHours(eh, em, 0, 0);
      const payload = {
        member_id: Number(newBlock.memberId),
        blocks: [
          {
            start_time: start.toISOString(),
            end_time: end.toISOString(),
          },
        ],
      };
      const res = await fetch(`/api/teams/${teamId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setAvailability((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          memberId: newBlock.memberId,
          dayOfWeek: newBlock.dayOfWeek,
          startTime: newBlock.startTime,
          endTime: newBlock.endTime,
        },
      ]);
      toast.success("Availability block added");
    } catch {
      toast.error("Failed to add availability");
    } finally {
      setAvailabilitySubmitting(false);
    }
  };

  const addWeekPreset = async () => {
    if (!teamId) {
      toast.error("Select a team first");
      return;
    }
    if (!newBlock.memberId) {
      toast.error("Please select a team member");
      return;
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const now = new Date();
      const day = now.getDay();
      const daysUntilMonday = (8 - day) % 7 || 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() + daysUntilMonday);
      const blocks = [0, 1, 2, 3, 4].map((offset) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + offset);
        const start = new Date(d);
        start.setHours(9, 0, 0, 0);
        const end = new Date(d);
        end.setHours(17, 0, 0, 0);
        return { start_time: start.toISOString(), end_time: end.toISOString() };
      });
      const payload = { member_id: Number(newBlock.memberId), blocks };
      const res = await fetch(`/api/teams/${teamId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(`Added Mon–Fri 9–5 for next week (${tz})`);
    } catch {
      toast.error("Failed to add weekly preset");
    }
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
            <div className="flex items-center gap-2">
              <div
                className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border/40 px-2 py-1"
                role="status"
                aria-live="polite"
                title={apiStatus === "ok" ? "API healthy" : apiStatus === "down" ? "API unreachable" : "API status unknown"}
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    apiStatus === "ok" ? "bg-emerald-500" : apiStatus === "down" ? "bg-red-500" : "bg-yellow-500"
                  }`}
                  aria-hidden="true"
                />
                <span className="text-xs text-muted-foreground">API</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="backdrop-blur-sm border-primary/30 hover:border-primary/50"
                onClick={() => {
                  if (!teamId) {
                    toast.error("Select a team first");
                    return;
                  }
                  const link = `${window.location.origin}/book/${teamId}`;
                  navigator.clipboard.writeText(link).then(() => toast.success("Booking link copied"));
                }}
                disabled={!isTeamSelected}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="backdrop-blur-sm border-primary/30 hover:border-primary/50"
                onClick={() => {
                  if (!teamId) {
                    toast.error("Select a team first");
                    return;
                  }
                  window.open(`/book/${teamId}`, "_blank");
                }}
                disabled={!isTeamSelected}
              >
                <Calendar className="mr-2 h-4 w-4" />
                View Public Page
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-destructive/40 hover:border-destructive/60">
                    Logout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Log out?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You'll be redirected to the admin login. Your team data stays saved locally.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex justify-end gap-2 pt-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        try {
                          localStorage.removeItem("adminToken");
                          localStorage.removeItem("teamId");
                        } catch {}
                        navigate("/admin/login", { replace: true });
                      }}
                    >
                      Logout
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 relative">
        <DecorativeImage variant="figure" className="top-20 right-0 w-64 opacity-10" />
        <DecorativeImage variant="rose" className="bottom-20 left-0 w-48 opacity-10" />
        <div className="grid gap-8 lg:grid-cols-2 relative z-10">
          {/* Team Selection & Creation */}
          <Card className="dreamy-card shadow-dreamy border-border/40 transition-all duration-500 hover:shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Teams</CardTitle>
              <CardDescription>Select or create a team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="team">Select Team</Label>
                <select
                  id="team"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={teamId ?? ""}
                  onChange={async (e) => {
                    const id = Number(e.target.value);
                    setTeamId(id);
                    localStorage.setItem("teamId", String(id));
                    await fetchMembers(id);
                  }}
                >
                  <option value="">Select team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Input placeholder="New team name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
                </div>
                <Button onClick={createTeam}>Create</Button>
              </div>
              <div className="flex justify-between pt-2">
                <div className="text-xs text-muted-foreground">
                  {teamId ? `Selected Team ID: ${teamId}` : "No team selected"}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={!isTeamSelected}>
                      Delete Team
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this team?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the team from your local list. Server-side removal will be attempted if available.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-end gap-2 pt-2">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteTeam}>Delete</AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

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
                    onBlur={() => setMemberTouched((t) => ({ ...t, name: true }))}
                    aria-invalid={memberTouched.name && !newMember.name}
                    aria-describedby={memberTouched.name && !newMember.name ? "name-error" : undefined}
                  />
                  {memberTouched.name && !newMember.name && (
                    <p id="name-error" className="mt-1 text-xs text-destructive">Name is required</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="google-link">Google Calendar Link</Label>
                  <Input
                    id="google-link"
                    placeholder="https://calendar.google.com/..."
                    value={newMember.googleLink}
                    onChange={(e) => setNewMember({ ...newMember, googleLink: e.target.value })}
                    onBlur={() => setMemberTouched((t) => ({ ...t, googleLink: true }))}
                    aria-invalid={memberTouched.googleLink && !newMember.googleLink}
                    aria-describedby={memberTouched.googleLink && !newMember.googleLink ? "google-link-error" : undefined}
                  />
                  {memberTouched.googleLink && !newMember.googleLink && (
                    <p id="google-link-error" className="mt-1 text-xs text-destructive">Link is required</p>
                  )}
                </div>
                <Button
                  onClick={addMember}
                  className="w-full shadow-soft hover:shadow-dreamy transition-all duration-500"
                  disabled={!isTeamSelected || !isNewMemberValid || memberSubmitting}
                >
                  {memberSubmitting ? "Adding..." : "Add Member"}
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
                      <p className="text-sm text-muted-foreground truncate">{member.google_booking_link}</p>
                    </div>
                    <Button size="sm" variant="default" onClick={() => connectOAuth(member.id)}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Connect
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
              <CardDescription className="flex items-center gap-2">
                Set availability blocks for team members
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  Times shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </span>
              </CardDescription>
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
                    onBlur={() => setAvailabilityTouched((t) => ({ ...t, memberId: true }))}
                    aria-invalid={availabilityTouched.memberId && !newBlock.memberId}
                    aria-describedby={availabilityTouched.memberId && !newBlock.memberId ? "member-error" : undefined}
                  >
                    <option value="">Select member</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  {availabilityTouched.memberId && !newBlock.memberId && (
                    <p id="member-error" className="mt-1 text-xs text-destructive">Member is required</p>
                  )}
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
                      onBlur={() => setAvailabilityTouched((t) => ({ ...t, startTime: true }))}
                      aria-invalid={availabilityTouched.startTime && !newBlock.startTime}
                      aria-describedby={availabilityTouched.startTime && !newBlock.startTime ? "start-error" : undefined}
                    />
                    {availabilityTouched.startTime && !newBlock.startTime && (
                      <p id="start-error" className="mt-1 text-xs text-destructive">Start time is required</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="end">End Time</Label>
                    <Input
                      id="end"
                      type="time"
                      value={newBlock.endTime}
                      onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                      onBlur={() => setAvailabilityTouched((t) => ({ ...t, endTime: true }))}
                      aria-invalid={availabilityTouched.endTime && !newBlock.endTime}
                      aria-describedby={availabilityTouched.endTime && !newBlock.endTime ? "end-error" : undefined}
                    />
                    {availabilityTouched.endTime && !newBlock.endTime && (
                      <p id="end-error" className="mt-1 text-xs text-destructive">End time is required</p>
                    )}
                  </div>
                </div>
                {availabilityTouched.startTime && availabilityTouched.endTime && !isAvailabilityTimeValid && (
                  <p className="text-xs text-destructive">End time must be after start time</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={addAvailability}
                    className="w-full shadow-soft hover:shadow-dreamy transition-all duration-500"
                    disabled={!isTeamSelected || !isAvailabilityValid || availabilitySubmitting}
                  >
                    {availabilitySubmitting ? "Adding..." : "Add Availability"}
                  </Button>
                  <Button variant="outline" onClick={addWeekPreset} className="w-full" disabled={!newBlock.memberId}>
                    Add Mon–Fri 9–5 Next Week
                  </Button>
                </div>
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
