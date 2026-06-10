"use client";

// Static visual reference for the Divvy design system. Renders every primitive
// so design drift is caught early. Not linked from the product flow.

import { useState } from "react";
import {
  BackgroundFlourish,
  Button,
  Card,
  Chip,
  GoldButton,
  GoldDivider,
  NavBar,
  SectionHeader,
  Spinner,
  type as T,
} from "@/components/ui";
import Logo from "@/components/Logo";
import {
  AddOnIcon,
  CameraIcon,
  CheckIcon,
  GroupIcon,
  MoreIcon,
  PlusIcon,
  ReceiptIcon,
  ScanIcon,
  SendIcon,
  ShareIcon,
  SplitIcon,
  TrashIcon,
  UngroupIcon,
} from "@/components/icons";

export default function StyleguidePage() {
  const [sel, setSel] = useState(true);
  const icons = [
    [CameraIcon, "camera"],
    [ScanIcon, "scan"],
    [ReceiptIcon, "receipt"],
    [ShareIcon, "share"],
    [SendIcon, "send"],
    [PlusIcon, "plus"],
    [MoreIcon, "more"],
    [SplitIcon, "split"],
    [GroupIcon, "group"],
    [UngroupIcon, "ungroup"],
    [AddOnIcon, "add-on"],
    [TrashIcon, "trash"],
    [CheckIcon, "check"],
  ] as const;

  return (
    <main className="min-h-full">
      <BackgroundFlourish />
      <NavBar title="Styleguide" />
      <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
        <section className="space-y-2">
          <SectionHeader>Brand</SectionHeader>
          <Card className="flex items-center gap-4">
            <Logo className="h-16 w-16 rounded-[18px]" />
            <Logo className="h-10 w-10 rounded-[12px]" />
            <div>
              <p className={`${T.display} text-primary`}>Divvy</p>
              <p className={`${T.caption} text-text-secondary`}>
                Split the bill, not the friendship
              </p>
            </div>
          </Card>
        </section>

        <section className="space-y-2">
          <SectionHeader>Typography</SectionHeader>
          <Card className="space-y-2">
            <p className={`${T.display} text-text-primary`}>Display 32 serif</p>
            <p className={`${T.headline} text-text-primary`}>Headline 20 serif</p>
            <p className={`${T.title} text-text-primary`}>Title 17 rounded</p>
            <p className={`${T.body} text-text-primary`}>Body 16 system</p>
            <p className={`${T.label} text-text-primary`}>Label 15 rounded</p>
            <p className={`${T.caption} text-text-secondary`}>Caption 13</p>
            <p className={`${T.price} text-text-primary`}>$16.50 price</p>
            <p className={`${T.priceLarge} text-primary`}>$132.40 price large</p>
          </Card>
        </section>

        <section className="space-y-2">
          <SectionHeader>Icons</SectionHeader>
          <Card className="flex flex-wrap gap-4">
            {icons.map(([Icon, name]) => (
              <div key={name} className="flex w-14 flex-col items-center gap-1">
                <Icon className="h-6 w-6 text-primary" />
                <span className={`${T.small} text-text-tertiary`}>{name}</span>
              </div>
            ))}
          </Card>
        </section>

        <section className="space-y-2">
          <SectionHeader>Buttons</SectionHeader>
          <div className="space-y-3">
            <Button>
              <CameraIcon /> Primary button
            </Button>
            <Button variant="secondary">
              <ScanIcon /> Secondary button
            </Button>
            <Button variant="destructive">Delete</Button>
            <Button disabled>Disabled</Button>
            <div>
              <GoldButton>
                <SendIcon className="h-4 w-4" /> Request
              </GoldButton>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <SectionHeader>Chips</SectionHeader>
          <div className="flex flex-wrap gap-2">
            <Chip selected={sel} onClick={() => setSel((v) => !v)}>
              Ashna
            </Chip>
            <Chip selected={!sel} onClick={() => setSel((v) => !v)}>
              Sam
            </Chip>
            <Chip selected={false}>Jordan</Chip>
          </div>
        </section>

        <section className="space-y-2">
          <SectionHeader>Divider &amp; color</SectionHeader>
          <Card className="space-y-3">
            <GoldDivider />
            <div className="flex flex-wrap gap-2">
              {[
                ["primary", "bg-primary"],
                ["primary-light", "bg-primary-light"],
                ["gold", "bg-gold"],
                ["gold-light", "bg-gold-light"],
                ["card", "bg-card border border-gold/30"],
                ["bg-deep", "bg-background-deep"],
                ["success", "bg-success"],
                ["destructive", "bg-destructive"],
              ].map(([name, cls]) => (
                <div key={name} className="text-center">
                  <div className={`h-12 w-16 rounded-[10px] ${cls}`} />
                  <span className={`${T.small} text-text-tertiary`}>{name}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="space-y-2">
          <SectionHeader>Loading</SectionHeader>
          <Card className="flex items-center gap-3">
            <Spinner />
            <span className={`${T.body} text-text-secondary`}>Detecting receipt…</span>
          </Card>
        </section>
      </div>
    </main>
  );
}
