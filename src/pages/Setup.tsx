import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Setup = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/setup/status");
        const data = await res.json();
        if (data.initialized) {
          navigate("/admin/login", { replace: true });
        }
      } catch {
        // ignore
      }
    };
    check();
  }, [navigate]);

  const handleInit = async () => {
    if (!username || !password) {
      toast.error("Username and password are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/setup/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        toast.error("Setup failed or already initialized");
        return;
      }
      const data = await res.json();
      localStorage.setItem("adminToken", data.token);
      toast.success("Super admin created");
      navigate("/", { replace: true });
    } catch {
      toast.error("Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full dreamy-card shadow-elevated border-border/40">
        <CardHeader>
          <CardTitle>First-time Setup</CardTitle>
          <CardDescription>Create super admin credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleInit} disabled={loading}>
            {loading ? "Setting up..." : "Initialize"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Setup;


