"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  ClipboardList,
  Plus,
  Loader2,
  ExternalLink,
  FileText,
  Search,
  Image,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

// --- Interfaces ---
interface RequestEntry {
  requestNo: string
  timestamp: string
  groupHead: string
  payTo: string
  amount: number
  remarks: string
  attachment: string
  name: string
  department: string
}

interface AppUser {
  id: string
  name: string
  role: "user" | "admin"
}

interface RequestViewProps {
  currentUser: AppUser
}

// --- Constants ---
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwJn_U3Js50o2YdBN9DFaErLYXKWEDluUf1JjQJGet7d_TN7-O8ZaRWU3bxnf_nc7jAGw/exec"
const GOOGLE_DRIVE_FOLDER_ID = "1RKUNn_iSYtxfBVTtiPs406cULtj9-J5l" // Reuse from form-view or use a specific one
const REQUEST_SHEET_NAME = "Request"
const MASTER_SHEET_NAME = "Master"

const RequestView: React.FC<RequestViewProps> = ({ currentUser }) => {
  const { toast } = useToast()

  // State for data
  const [requests, setRequests] = useState<RequestEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // State for form
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    groupHead: "",
    payTo: "",
    amount: "",
    remarks: "",
    name: currentUser.name,
    department: "",
  })
  const [attachment, setAttachment] = useState<File | null>(null)

  // Options for dropdowns (could be fetched from Master)
  const [groupHeads, setGroupHeads] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])

  // Custom dropdown state
  const [isDeptListOpen, setIsDeptListOpen] = useState(false)
  const deptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(event.target as Node)) {
        setIsDeptListOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${APP_SCRIPT_URL}?sheet=${REQUEST_SHEET_NAME}&action=fetch`)
      const jsonData = await response.json()

      if (jsonData.success && jsonData.data) {
        // Skip header rows (headers are on Row 6, so data starts on Row 7 / index 6)
        const rows = jsonData.data.slice(6)
        const parsedRequests: RequestEntry[] = rows
          .map((row: any) => ({
            timestamp: row[0] || "",
            requestNo: row[1] || "",
            groupHead: row[2] || "",
            payTo: row[3] || "",
            amount: Number(row[4]) || 0,
            remarks: row[5] || "",
            attachment: row[6] || "",
            name: row[7] || "",
            department: row[8] || "",
          }))
          .filter((req: RequestEntry) => req.requestNo) // Only valid entries
        // Sort by timestamp desc
        // Sort by requestNo ascending (Sequential)
        parsedRequests.sort((a, b) => {
          const numA = parseInt(a.requestNo.replace("REQ-", "") || "0", 10)
          const numB = parseInt(b.requestNo.replace("REQ-", "") || "0", 10)
          return numA - numB
        })
        setRequests(parsedRequests)
      }
    } catch (error) {
      console.error("Error fetching requests:", error)
      toast({
        title: "Error",
        description: "Failed to load requests.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMasterData = async () => {
    try {
      const response = await fetch(`${APP_SCRIPT_URL}?sheet=${MASTER_SHEET_NAME}&action=fetch`)
      const jsonData = await response.json()
      if (jsonData.success && jsonData.data) {
        const rows = jsonData.data.slice(1)
        const heads = Array.from(new Set(rows.map((row: any) => row[2]).filter(Boolean))) as string[]
        const depts = Array.from(new Set(rows.map((row: any) => row[8]).filter(Boolean))) as string[]
        setGroupHeads(heads)
        setDepartments(depts)
      }
    } catch (error) {
      console.error("Error fetching master data:", error)
    }
  }

  useEffect(() => {
    fetchRequests()
    fetchMasterData()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const loadingToast = toast({
      title: "Submitting Request...",
      description: "Uploading any files and recording data.",
      duration: 10000,
    })

    try {
      let attachmentUrl = ""
      if (attachment) {
        const reader = new FileReader()
        attachmentUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = async () => {
            const base64Data = reader.result?.toString().split(",")[1]
            try {
              const uploadBody = new URLSearchParams({
                action: "uploadFile",
                fileName: `REQ_${Date.now()}_${attachment.name}`,
                base64Data: base64Data || "",
                mimeType: attachment.type,
                folderId: GOOGLE_DRIVE_FOLDER_ID,
              }).toString()

              const uploadResponse = await fetch(APP_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: uploadBody,
              })
              const uploadResult = await uploadResponse.json()
              if (uploadResult.success) resolve(uploadResult.fileUrl)
              else reject(new Error("Upload failed"))
            } catch (err) {
              reject(err)
            }
          }
          reader.readAsDataURL(attachment)
        })
      }

      const now = new Date()
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

      // Sequential Request No Logic
      let nextNum = 1
      if (requests.length > 0) {
        const nums = requests.map(r => {
          const match = r.requestNo.match(/REQ-(\d+)/)
          return match ? parseInt(match[1]) : 0
        }).filter(n => !isNaN(n))

        if (nums.length > 0) {
          nextNum = Math.max(...nums) + 1
        }
      }
      const requestNo = `REQ-${String(nextNum).padStart(3, '0')}`

      const rowData = [
        timestamp,
        requestNo,
        formData.groupHead,
        formData.payTo,
        Number(formData.amount) || 0,
        formData.remarks,
        attachmentUrl,
        formData.name,
        formData.department,
        "", // Planned
        "", // Actual
        "", // Delay
        "", // Status1
        "", // Remarks1
      ]

      const submitBody = new URLSearchParams({
        action: "insert",
        sheetName: REQUEST_SHEET_NAME,
        rowData: JSON.stringify(rowData),
      }).toString()

      const response = await fetch(APP_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: submitBody,
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Request submitted successfully!",
        })
        setIsDialogOpen(false)
        setFormData({
          groupHead: "",
          payTo: "",
          amount: "",
          remarks: "",
          name: currentUser.name,
          department: "",
        })
        setAttachment(null)
        fetchRequests() // Refresh table
      } else {
        throw new Error(result.error || "Submission failed")
      }
    } catch (error: any) {
      console.error("Submission error:", error)
      toast({
        title: "Submission Failed",
        description: error.message || "An error occurred during submission.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      loadingToast.dismiss()
    }
  }

  const filteredRequests = requests.filter(req =>
    Object.values(req).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <ClipboardList className="h-6 w-6 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Requests</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search requests..."
              className="pl-10 w-full md:w-64 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Request
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-slate-200">
          <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
            Request History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Loading requests...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>Req No.</TableHead>
                    <TableHead>Group Head</TableHead>
                    <TableHead>Pay To</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-center">Attachments</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req) => (
                    <TableRow key={req.requestNo} className="hover:bg-slate-50">
                      <TableCell className="font-medium text-purple-600">{req.requestNo}</TableCell>
                      <TableCell>{req.groupHead}</TableCell>
                      <TableCell>{req.payTo}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{new Intl.NumberFormat('en-IN').format(req.amount)}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate" title={req.remarks}>
                        {req.remarks}
                      </TableCell>
                      <TableCell className="text-center">
                        {req.attachment ? (
                          <a href={req.attachment} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline inline-flex items-center gap-1">
                            <Image className="h-6 w-6" />
                          </a>
                        ) : (
                          <span className="text-slate-300">--</span>
                        )}
                      </TableCell>
                      <TableCell>{req.name}</TableCell>
                      <TableCell>{req.department}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Request</DialogTitle>
            <DialogDescription>
              Fill in the details below to submit a new payment request.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupHead">Group Head</Label>
              <Select value={formData.groupHead} onValueChange={(v) => handleSelectChange("groupHead", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Group Head" />
                </SelectTrigger>
                <SelectContent>
                  {groupHeads.map((head) => (
                    <SelectItem key={head} value={head}>{head}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payTo">Pay To</Label>
              <Input
                id="payTo"
                name="payTo"
                required
                placeholder="Name of recipient"
                value={formData.payTo}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount To Be Paid</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={formData.amount}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2" ref={deptRef}>
              <Label htmlFor="department">Department</Label>
              <div className="relative">
                <Input
                  id="department"
                  name="department"
                  placeholder="Select or enter department"
                  value={formData.department}
                  onChange={(e) => {
                    handleInputChange(e)
                    setIsDeptListOpen(true)
                  }}
                  onFocus={() => setIsDeptListOpen(true)}
                  className="pr-10" // Make room for the icon
                  autoComplete="off"
                />
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400"
                  onClick={() => setIsDeptListOpen(!isDeptListOpen)}
                >
                  <ChevronDown className="h-4 w-4" />
                </div>

                {isDeptListOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {departments.filter(d => d.toLowerCase().includes(formData.department.toLowerCase())).length > 0 ? (
                      departments
                        .filter(d => d.toLowerCase().includes(formData.department.toLowerCase()))
                        .map((dept) => (
                          <div
                            key={dept}
                            className="px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 cursor-pointer transition-colors"
                            onClick={() => {
                              handleSelectChange("department", dept)
                              setIsDeptListOpen(false)
                            }}
                          >
                            {dept}
                          </div>
                        ))
                    ) : (
                      formData.department && <div className="px-4 py-2 text-sm text-slate-400 italic">No matching departments</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                name="remarks"
                placeholder="Purpose or additional details"
                value={formData.remarks}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Requestor Name</Label>
              <Input
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                disabled={currentUser.role !== 'admin'}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="attachment">Any Attachments</Label>
              <Input
                id="attachment"
                type="file"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>

            <DialogFooter className="md:col-span-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RequestView
