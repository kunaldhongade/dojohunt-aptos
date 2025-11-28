"use client";

import { QuestionForm } from "@/components/admin/question-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateQuestionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, isPublished: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create challenge");
      }
      router.push("/admin");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Failed to create challenge");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container py-10 max-w-4xl">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" className="px-0">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Add New Question</CardTitle>
            <CardDescription>Create a new coding challenge</CardDescription>
          </CardHeader>
          <CardContent>
            <QuestionForm
              onSubmit={handleSubmit}
              onCancel={() => router.push("/admin")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
