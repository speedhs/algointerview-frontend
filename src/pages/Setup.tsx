import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false, confirm: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initialized = localStorage.getItem("adminSetup") === "true";
    if (initialized) navigate("/admin/login", { replace: true });
  }, [navigate]);

  const isValid = Boolean(username.trim()) && password.length >= 8 && confirm === password;

  const handleInit = async () => {
    if (!isValid) {
      toast.error("Fix the errors before continuing");
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
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, username: true }))}
              aria-invalid={touched.username && !username}
            />
            {touched.username && !username && (
              <p className="mt-1 text-xs text-destructive">Username is required</p>
            )}
          </div>
          <div>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              aria-invalid={touched.password && password.length < 8}
            />
            <div className="mt-2 flex items-center gap-2">
              <Checkbox id="show-pass" checked={showPassword} onCheckedChange={(v) => setShowPassword(Boolean(v))} />
              <label htmlFor="show-pass" className="text-xs text-muted-foreground">Show password</label>
            </div>
            {touched.password && password.length < 8 && (
              <p className="mt-1 text-xs text-destructive">Password must be at least 8 characters</p>
            )}
          </div>
          <div>
            <Input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              aria-invalid={touched.confirm && confirm !== password}
            />
            <div className="mt-2 flex items-center gap-2">
              <Checkbox id="show-confirm" checked={showConfirm} onCheckedChange={(v) => setShowConfirm(Boolean(v))} />
              <label htmlFor="show-confirm" className="text-xs text-muted-foreground">Show confirm</label>
            </div>
            {touched.confirm && confirm !== password && (
              <p className="mt-1 text-xs text-destructive">Passwords do not match</p>
            )}
          </div>
          <Button className="w-full" onClick={handleInit} disabled={loading || !isValid}>
            {loading ? "Setting up..." : "Initialize"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Setup;


