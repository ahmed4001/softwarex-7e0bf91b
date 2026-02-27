import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, UserPlus, Mail, Lock, User, Shield, Star, Zap, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  const [activeTab, setActiveTab] = useState("login");

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

  const benefits = [
    { icon: Star, label: "Trusted Reviews" },
    { icon: Zap, label: "Smart Comparisons" },
    { icon: Shield, label: "Verified Data" },
  ];

  return (
    <>
      <SeoHead title={`${t("login.signIn")} — SoftwareHub`} description={t("login.subtitle")} />
      <div className="min-h-screen flex relative overflow-hidden">
        {/* Left panel — branding */}
        <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center p-12 overflow-hidden">
          {/* Background layers */}
          <div className="absolute inset-0 bg-primary" />
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 30% 20%, hsl(280 60% 60% / 0.4) 0%, transparent 50%),
                                radial-gradient(circle at 70% 80%, hsl(213 90% 50% / 0.3) 0%, transparent 50%)`,
            }}
          />
          {/* Floating shapes */}
          <div className="absolute top-20 left-16 w-24 h-24 rounded-3xl border border-primary-foreground/10 rotate-12 animate-float" />
          <div className="absolute bottom-32 right-20 w-16 h-16 rounded-2xl border border-primary-foreground/10 -rotate-12 animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/3 right-16 w-8 h-8 rounded-full bg-primary-foreground/10 animate-float" style={{ animationDelay: '4s' }} />

          <div className="relative z-10 max-w-md text-primary-foreground">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm mb-8 text-sm font-medium">
                <Shield className="h-4 w-4" />
                Trusted by 50,000+ professionals
              </div>
              <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight mb-6">
                Discover the<br />
                <span className="opacity-80">best software</span><br />
                for your stack.
              </h1>
              <p className="text-lg text-primary-foreground/70 leading-relaxed mb-10 max-w-sm">
                Join a community of buyers and builders making smarter software decisions every day.
              </p>
              <div className="flex flex-col gap-4">
                {benefits.map((b, i) => (
                  <motion.div
                    key={b.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.15 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
                      <b.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{b.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
          <div className="absolute inset-0 mesh-gradient opacity-50" />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[420px] relative z-10"
          >
            {/* Logo + heading */}
            <div className="text-center mb-8">
              <div className="h-14 w-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-5 animate-pulse-glow">
                <span className="text-xl font-extrabold text-primary-foreground tracking-tight">S</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {activeTab === "login" ? t("login.welcome") : "Create your account"}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {activeTab === "login" ? t("login.subtitle") : "Start discovering the best software tools"}
              </p>
            </div>

            {/* Card */}
            <div className="rounded-2xl border bg-card p-7 sm:p-8" style={{ boxShadow: "var(--shadow-lg)" }}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-7 h-12 rounded-xl bg-muted p-1">
                  <TabsTrigger value="login" className="flex-1 rounded-lg h-full text-sm font-semibold data-[state=active]:shadow-md transition-all">
                    {t("login.signIn")}
                  </TabsTrigger>
                  <TabsTrigger value="register" className="flex-1 rounded-lg h-full text-sm font-semibold data-[state=active]:shadow-md transition-all">
                    {t("login.register")}
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <TabsContent value="login" key="login" asChild>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                      <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="login-email" className="text-sm font-semibold">{t("login.email")}</Label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required placeholder="you@example.com" className="h-12 rounded-xl pl-10 bg-muted/40 border-border/60 focus:bg-background transition-colors" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="login-password" className="text-sm font-semibold">{t("login.password")}</Label>
                            <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">{t("login.forgotPassword")}</Link>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="login-password" type={showLoginPass ? "text" : "password"} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required placeholder="••••••••" className="h-12 rounded-xl pl-10 pr-10 bg-muted/40 border-border/60 focus:bg-background transition-colors" />
                            <button type="button" onClick={() => setShowLoginPass(!showLoginPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                              {showLoginPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <Button type="submit" className="w-full h-12 btn-premium rounded-xl text-primary-foreground font-semibold gap-2 text-[15px]" disabled={loginLoading}>
                          {loginLoading ? (
                            <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> {t("login.signingIn")}</span>
                          ) : (
                            <>{t("login.signIn")} <ArrowRight className="h-4 w-4" /></>
                          )}
                        </Button>
                      </form>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="register" key="register" asChild>
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                      <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="reg-name" className="text-sm font-semibold">{t("login.fullName")}</Label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="reg-name" value={regName} onChange={(e) => setRegName(e.target.value)} required maxLength={100} placeholder="John Doe" className="h-12 rounded-xl pl-10 bg-muted/40 border-border/60 focus:bg-background transition-colors" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-email" className="text-sm font-semibold">{t("login.email")}</Label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required placeholder="you@example.com" className="h-12 rounded-xl pl-10 bg-muted/40 border-border/60 focus:bg-background transition-colors" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-password" className="text-sm font-semibold">{t("login.password")}</Label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="reg-password" type={showRegPass ? "text" : "password"} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" className="h-12 rounded-xl pl-10 pr-10 bg-muted/40 border-border/60 focus:bg-background transition-colors" />
                            <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                              {showRegPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {/* Password strength indicator */}
                          {regPassword.length > 0 && (
                            <div className="flex gap-1.5 pt-1">
                              {[1, 2, 3, 4].map((level) => (
                                <div
                                  key={level}
                                  className="h-1 flex-1 rounded-full transition-all duration-300"
                                  style={{
                                    background: regPassword.length >= level * 3
                                      ? level <= 2
                                        ? "hsl(var(--warning))"
                                        : "hsl(var(--success))"
                                      : "hsl(var(--muted))",
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <Button type="submit" className="w-full h-12 btn-premium rounded-xl text-primary-foreground font-semibold gap-2 text-[15px]" disabled={regLoading}>
                          {regLoading ? (
                            <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> {t("login.creatingAccount")}</span>
                          ) : (
                            <><UserPlus className="h-4 w-4" /> {t("auth.createAccount")}</>
                          )}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          {t("login.verifyEmail")}
                        </p>
                      </form>
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </div>

            {/* Footer trust text */}
            <p className="text-xs text-center text-muted-foreground mt-6">
              By continuing, you agree to our <Link to="/page/terms" className="underline hover:text-foreground transition-colors">Terms</Link> and <Link to="/page/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</Link>.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
