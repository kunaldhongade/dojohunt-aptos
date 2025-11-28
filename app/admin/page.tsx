"use client";

import { QuestionForm } from "@/components/admin/question-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Eye, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      // Use admin=true to fetch all challenges including unpublished ones
      const response = await fetch("/api/challenges?admin=true&limit=100");
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }
      const data = await response.json();
      setQuestions(data.data?.items || []);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Failed to load questions");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(
    (question) =>
      question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteQuestion = async (id: string) => {
    // Confirm deletion
    if (!confirm("Are you sure you want to permanently delete this challenge? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/challenges/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete challenge");
      }

      // Remove from local state
      setQuestions(questions.filter((q) => q.id !== id));
      
      // Optionally refresh the list from database to ensure consistency
      await fetchQuestions();
    } catch (error) {
      console.error("Error deleting challenge:", error);
      alert(error instanceof Error ? error.message : "Failed to delete challenge. Please try again.");
    }
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
    setShowAddForm(true);
  };

  const handleAddQuestion = async (question: any) => {
    try {
      // Create challenge via API and publish immediately
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...question, isPublished: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create challenge");
      }
      // Refresh list from DB so it persists after reload
      await fetchQuestions();
    } catch (e: any) {
      console.error("Create challenge error", e);
      alert(e?.message || "Failed to create challenge");
    } finally {
      setShowAddForm(false);
      setEditingQuestion(null);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    // Normalize to handle both enum (EASY) and label (Easy)
    const d = (difficulty || "").toString().toUpperCase();
    switch (difficulty) {
      case "Easy":
      case "EASY":
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-none">
            Easy
          </Badge>
        );
      case "Medium":
      case "MEDIUM":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-none">
            Medium
          </Badge>
        );
      case "Hard":
      case "HARD":
        return (
          <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-none">
            Hard
          </Badge>
        );
      default:
        return <Badge>{difficulty}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage coding challenges and platform content
            </p>
          </div>
        </div>

        <Tabs defaultValue="questions" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="questions" className="mt-6">
            {showAddForm ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingQuestion ? "Edit Question" : "Add New Question"}
                  </CardTitle>
                  <CardDescription>
                    {editingQuestion
                      ? "Update the details of an existing question"
                      : "Create a new coding challenge for users"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QuestionForm
                    initialData={editingQuestion}
                    onSubmit={handleAddQuestion}
                    onCancel={() => {
                      setShowAddForm(false);
                      setEditingQuestion(null);
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search questions..."
                      className="w-full pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Link href="/admin/create-quetion">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add New Question
                    </Button>
                  </Link>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Difficulty</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                                Loading questions...
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : error ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-red-500"
                            >
                              {error}
                            </TableCell>
                          </TableRow>
                        ) : filteredQuestions.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-muted-foreground"
                            >
                              No questions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredQuestions.map((question) => (
                            <TableRow key={question.id}>
                              <TableCell className="font-medium">
                                {question.title}
                              </TableCell>
                              <TableCell>
                                {getDifficultyBadge(question.difficulty)}
                              </TableCell>
                              <TableCell>{question.category}</TableCell>
                              <TableCell>
                                {question.createdAt
                                  ? new Date(question.createdAt).toLocaleDateString()
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    question.isPublished && question.isActive
                                      ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-none"
                                      : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-none"
                                  }
                                >
                                  {question.isPublished && question.isActive
                                    ? "Published"
                                    : question.isPublished
                                    ? "Draft"
                                    : "Unpublished"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                    >
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleEditQuestion(question)
                                      }
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Link
                                        href={`/challenges/${question.id}`}
                                        className="flex items-center w-full"
                                      >
                                        <Eye className="mr-2 h-4 w-4" />
                                        Preview
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-500 focus:text-red-500"
                                      onClick={() =>
                                        handleDeleteQuestion(question.id)
                                      }
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage platform users and their permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  User management functionality will be implemented here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>
                  Configure global platform settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Platform settings will be implemented here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
