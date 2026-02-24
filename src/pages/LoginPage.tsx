import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoginLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("login.welcomeBack"));
    navigate("/");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword.length < 6) { toast.error(t("login.passwordMin")); return; }
    setRegLoading(true);
    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: { name: regName.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    setRegLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("login.checkEmail"));
  };

  return (
    <>
      <SeoHead title={`${t("login.signIn")} — SoftwareHub`} description={t("login.subtitle")} />
      <div className="min-h-[80vh] flex items-center justify-center py-16 relative">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm relative"
        >
          <div className="text-center mb-10">
            <div className="h-14 w-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-5 animate-pulse-glow">
              <span className="text-xl font-display font-black text-primary-foreground">S</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">{t("login.welcome")}</h1>
            <p className="text-muted-foreground mt-2">{t("login.subtitle")}</p>
          </div>

          <div className="glass-card p-8">
            <Tabs defaultValue="login">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="login" className="flex-1">{t("login.signIn")}</TabsTrigger>
                <TabsTrigger value="register" className="flex-1">{t("login.register")}</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <Label htmlFor="login-email" className="text-sm font-semibold">{t("login.email")}</Label>
                    <Input id="login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required placeholder="you@example.com" className="mt-2 h-12 rounded-xl" />
                  </div>
                  <div>
                    <Label htmlFor="login-password" className="text-sm font-semibold">{t("login.password")}</Label>
                    <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required placeholder="••••••••" className="mt-2 h-12 rounded-xl" />
                  </div>
                  <Button type="submit" className="w-full h-12 btn-premium rounded-xl text-primary-foreground font-semibold gap-2" disabled={loginLoading}>
                    {loginLoading ? t("login.signingIn") : <>{t("login.signIn")} <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                  <p className="text-xs text-center">
                    <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground transition-colors">{t("login.forgotPassword")}</Link>
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-5">
                  <div>
                    <Label htmlFor="reg-name" className="text-sm font-semibold">{t("login.fullName")}</Label>
                    <Input id="reg-name" value={regName} onChange={(e) => setRegName(e.target.value)} required maxLength={100} placeholder="John Doe" className="mt-2 h-12 rounded-xl" />
                  </div>
                  <div>
                    <Label htmlFor="reg-email" className="text-sm font-semibold">{t("login.email")}</Label>
                    <Input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required placeholder="you@example.com" className="mt-2 h-12 rounded-xl" />
                  </div>
                  <div>
                    <Label htmlFor="reg-password" className="text-sm font-semibold">{t("login.password")}</Label>
                    <Input id="reg-password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" className="mt-2 h-12 rounded-xl" />
                  </div>
                  <Button type="submit" className="w-full h-12 btn-premium rounded-xl text-primary-foreground font-semibold gap-2" disabled={regLoading}>
                    {regLoading ? t("login.creatingAccount") : <><UserPlus className="h-4 w-4" /> {t("auth.createAccount")}</>}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    {t("login.verifyEmail")}
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </>
  );
}
