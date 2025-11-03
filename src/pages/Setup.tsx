import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const Setup = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initialized = localStorage.getItem("adminSetup") === "true";
    if (initialized) navigate("/admin/login", { replace: true });
  }, [navigate]);

  const handleInit = async () => {
    if (!username || !password) {
      toast.error("Username and password are required");
      return;
    }
    setLoading(true);
    try {
      const hash = await sha256Hex(password);
      localStorage.setItem("adminSetup", "true");
      localStorage.setItem("adminUsername", username);
      localStorage.setItem("adminPasswordHash", hash);
      localStorage.setItem("adminToken", "local-admin-token");
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


