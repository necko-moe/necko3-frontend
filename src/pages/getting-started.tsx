import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Link2,
  Coins,
  FileText,
  ArrowRight,
  Heart,
} from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const stepKeys = [
  {
    number: 1,
    titleKey: "gettingStarted.step1Title",
    descKey: "gettingStarted.step1Description",
    icon: Link2,
    link: "/chains",
    linkKey: "gettingStarted.step1Link",
    required: true,
  },
  {
    number: 2,
    titleKey: "gettingStarted.step2Title",
    descKey: "gettingStarted.step2Description",
    icon: Coins,
    link: "/chains",
    linkKey: "gettingStarted.step2Link",
    required: false,
  },
  {
    number: 3,
    titleKey: "gettingStarted.step3Title",
    descKey: "gettingStarted.step3Description",
    icon: FileText,
    link: "/invoices",
    linkKey: "gettingStarted.step3Link",
    required: true,
  },
] as const;

export function GettingStartedPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("gettingStarted.title")}
        </h1>
        <p className="text-base text-muted-foreground">
          {t("gettingStarted.subtitle")}
        </p>
      </header>

      <div className="relative space-y-5">
        {stepKeys.map((step) => (
          <Card key={step.number} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <step.icon className="size-5" />
                </div>
                <div className="flex flex-1 items-center gap-2">
                  <CardTitle className="text-lg">{t(step.titleKey)}</CardTitle>
                  {!step.required && (
                    <Badge variant="secondary" className="text-xs">
                      {t("common.optional")}
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription className="mt-2 leading-relaxed pl-[52px]">
                {t(step.descKey)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-[68px]">
              <Button variant="outline" size="sm" asChild>
                <Link to={step.link}>
                  {t(step.linkKey)}
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          {t("gettingStarted.whatIsTitle")}
        </h2>
        <p className="leading-relaxed text-muted-foreground">
          {t("gettingStarted.whatIsP1")}
        </p>
        <p className="leading-relaxed text-muted-foreground">
          {t("gettingStarted.whatIsP2")}
        </p>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Heart className="size-3.5 text-destructive" />
          {t("gettingStarted.builtWithCare")}
        </div>
      </section>

      <a
        href="https://github.com/necko-moe"
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
              <GithubIcon className="size-6" />
            </div>
            <div className="flex-1">
              <p className="font-heading font-medium">{t("gettingStarted.githubTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("gettingStarted.githubSubtitle")}
              </p>
            </div>
            <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </CardContent>
        </Card>
      </a>
    </div>
  );
}
