"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Loader2,
    Plus,
    User,
    Shield,
    Key,
    Layers,
    Edit,
    UserPlus,
    Search,
    Trash2,
} from "lucide-react";
import { useAuth } from "@/components/auth-context";

// --- CONSTANTS ---
const APP_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwJn_U3Js50o2YdBN9DFaErLYXKWEDluUf1JjQJGet7d_TN7-O8ZaRWU3bxnf_nc7jAGw/exec";
const LOGIN_SHEET_NAME = "Login";

interface UserData {
    rowIndex: number; // 1-based index from sheet
    name: string;
    username: string;
    password: string;
    role: "admin" | "user";
    pages: string[];
    isDeleted: boolean;
}

const AVAILABLE_PAGES = [
    "Dashboard",
    "Request",
    "Approval",
    "Add New Transaction",
    "Reports",
];

export default function UserManagementPage() {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete Alert State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

    // Form State
    const [formData, setFormData] = useState<UserData>({
        rowIndex: -1,
        name: "",
        username: "",
        password: "",
        role: "user",
        pages: [],
        isDeleted: false,
    });

    const fetchUsers = async () => {
        setIsLoading(true);
        setError("");
        try {
            const url = `${APP_SCRIPT_URL}?sheet=${LOGIN_SHEET_NAME}&action=fetch`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch data");
            const json = await response.json();

            if (json.success && json.data) {
                // Skip header row (index 0)
                const mappedUsers: UserData[] = json.data.slice(1).map((row: any[], index: number) => ({
                    rowIndex: index + 2, // Excel row index (header is 1, so first data row is 2)
                    name: row[0] || "",
                    username: row[1] || "",
                    password: row[2] || "",
                    role: (row[3]?.toString().toLowerCase() === "admin" ? "admin" : "user"),
                    pages: row[4] ? row[4].toString().split(",").map((p: string) => {
                        const trimmed = p.trim();
                        // Case-insensitive match to AVAILABLE_PAGES to ensure checkboxes work
                        const matched = AVAILABLE_PAGES.find(ap => ap.toLowerCase() === trimmed.toLowerCase());
                        return matched || trimmed;
                    }).filter(Boolean) : [],
                    isDeleted: row[5] ? true : false, // Column F (index 5)
                }));
                // Filter out deleted users
                setUsers(mappedUsers.filter(u => !u.isDeleted));
            }
        } catch (err: any) {
            setError("Failed to load users: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenAdd = () => {
        setIsEditing(false);
        setFormData({
            rowIndex: -1,
            name: "",
            username: "",
            password: "",
            role: "user",
            pages: [],
            isDeleted: false,
        });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (user: UserData) => {
        setIsEditing(true);
        setFormData({ ...user });
        setIsDialogOpen(true);
    };

    const handleOpenDelete = (user: UserData) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };

    const togglePageSelection = (page: string) => {
        setFormData((prev) => {
            const currentPages = prev.pages;
            if (currentPages.includes(page)) {
                return { ...prev, pages: currentPages.filter((p) => p !== page) };
            } else {
                return { ...prev, pages: [...currentPages, page] };
            }
        });
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        setIsSubmitting(true);
        try {
            // Prepare row data with "deleted" in 6th column (index 5)
            // We pass empty strings for others as we don't want to change them, 
            // BUT the AppScript loop logic checks `if (rowData[i] !== '')`.
            // So to be safe and update specifically Column F, we can construct the array such that:
            // index 0-4 are "", index 5 is "deleted". 
            // The existing App Script iterates over provided array.

            const rowData = ["", "", "", "", "", "deleted"];

            // Wait, passing "" might mean "don't update this cell", which is what we want.
            // Let's verify the loop logic in description:
            // for (var i = 0; i < rowData.length; i++) {
            //   if (rowData[i] !== '') {
            //     sheet.getRange(rowIndex, i + 1).setValue(rowData[i]);
            //   }
            // }
            // So if we pass ["", "", "", "", "", "deleted"], it will ONLY update column F (index+1 = 6). Correct.

            const params = new URLSearchParams();
            params.append("sheetName", LOGIN_SHEET_NAME);
            params.append("action", "update");
            params.append("rowIndex", userToDelete.rowIndex.toString());
            params.append("rowData", JSON.stringify(rowData));

            const response = await fetch(APP_SCRIPT_URL, {
                method: "POST",
                body: params,
            });

            const result = await response.json();

            if (result.success) {
                setIsDeleteDialogOpen(false);
                setUserToDelete(null);
                fetchUsers(); // Refresh list to remove deleted user
            } else {
                throw new Error(result.error || result.message || "Operation failed");
            }
        } catch (err: any) {
            alert("Error deleting user: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Deduplicate pages before submitting
            const uniquePages = Array.from(new Set(formData.pages));
            const pagesString = uniquePages.join(", ");

            // Prepare row data: [Name, Username, Password, Role, Pages]
            const rowData = [
                formData.name,
                formData.username,
                formData.password,
                formData.role,
                pagesString
            ];

            const params = new URLSearchParams();
            params.append("sheetName", LOGIN_SHEET_NAME);

            if (isEditing) {
                params.append("action", "update");
                params.append("rowIndex", formData.rowIndex.toString());
            } else {
                params.append("action", "insert");
            }

            params.append("rowData", JSON.stringify(rowData));

            const response = await fetch(APP_SCRIPT_URL, {
                method: "POST",
                body: params,
            });

            const result = await response.json();

            if (result.success) {
                setIsDialogOpen(false);
                fetchUsers(); // Refresh list
            } else {
                throw new Error(result.error || result.message || "Operation failed");
            }

        } catch (err: any) {
            alert("Error saving user: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter users based on search
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
                    <p className="text-slate-500 mt-1">Manage system access and permissions</p>
                </div>
                <Button onClick={handleOpenAdd} className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-lg shadow-purple-200">
                    <UserPlus size={18} /> Add New User
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <Search className="text-slate-400" size={20} />
                <Input
                    placeholder="Search users by name or username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-none shadow-none focus-visible:ring-0 text-base"
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                </div>
            ) : error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
                    {error}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => (
                        <Card key={user.rowIndex} className="group hover:shadow-xl hover:shadow-purple-100 transition-all duration-300 border-slate-200">
                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        {user.name}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-1 font-mono text-xs">
                                        <User size={12} /> {user.username}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant={user.role === 'admin' ? "default" : "secondary"} className={`${user.role === 'admin' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-slate-100 text-slate-700'}`}>
                                        {user.role}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                        <Layers size={12} /> Accessible Pages
                                    </div>
                                    {user.role === 'admin' ? (
                                        <Badge variant="outline" className="w-full justify-center bg-green-50 text-green-700 border-green-200 py-1">
                                            Full System Access
                                        </Badge>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {user.pages.length > 0 ? (
                                                user.pages.map((page, idx) => (
                                                    <Badge key={idx} variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                                        {page}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">No specific pages assigned</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 flex justify-between">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenDelete(user)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(user)} className="gap-2 hover:border-purple-300 hover:text-purple-700">
                                        <Edit size={14} /> Edit Access
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit User" : "Add New User"}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? "Update user details and permissions." : "Create a new user account and assign pages."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input id="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(val: "admin" | "user") => setFormData({ ...formData, role: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {formData.role === 'user' && (
                            <div className="space-y-2 pt-2">
                                <Label className="block mb-2">Allowed Pages</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {AVAILABLE_PAGES.map((page) => (
                                        <div
                                            key={page}
                                            onClick={() => togglePageSelection(page)}
                                            className={`
                                    cursor-pointer text-sm border rounded-md p-2 flex items-center justify-between transition-colors
                                    ${formData.pages.includes(page)
                                                    ? 'bg-purple-100 border-purple-300 text-purple-700 font-medium'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                                `}
                                        >
                                            {page}
                                            {formData.pages.includes(page) && <Shield size={14} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Save Changes" : "Create User"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete this ID?
                            <strong> {userToDelete?.name}</strong>.
                            This action cannot be undone. Please think once again before proceeding.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault(); // Prevent auto-close to handle async
                                handleDelete();
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
