"use client"

import React, { useState, useEffect } from "react"
import {
    CheckCircle2,
    Loader2,
    ExternalLink,
    FileText,
    Search,
    Clock,
    History,
    Send
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

// --- Interfaces ---
interface RequestEntry {
    rowIndex: number
    timestamp: string
    requestNo: string
    groupHead: string
    payTo: string
    amount: number
    remarks: string
    attachment: string
    name: string
    department: string
    planned: string
    actual: string
    delay: string
    status1: string
    remarks1: string
}

// --- Constants ---
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwJn_U3Js50o2YdBN9DFaErLYXKWEDluUf1JjQJGet7d_TN7-O8ZaRWU3bxnf_nc7jAGw/exec"
const REQUEST_SHEET_NAME = "Request"

// --- Sub-components (Moved outside to fix focus loss) ---
const RequestTable = ({
    data,
    isHistory,
    checkedRows,
    toggleRow,
    rowInputs,
    handleInputChange,
    isUpdating
}: {
    data: RequestEntry[],
    isHistory: boolean,
    checkedRows: Set<string>,
    toggleRow: (requestNo: string) => void,
    rowInputs: Record<string, { status: string; remarks: string }>,
    handleInputChange: (requestNo: string, field: "status" | "remarks", value: string) => void,
    isUpdating: string | null
}) => (
    <div className="overflow-x-auto">
        <Table>
            <TableHeader>
                <TableRow className="bg-slate-50/50">
                    {!isHistory && (
                        <TableHead className="w-[50px]">
                            <Checkbox
                                checked={data.length > 0 && data.every(r => checkedRows.has(r.requestNo))}
                                onCheckedChange={(checked) => {
                                    data.forEach(r => {
                                        if (checked && !checkedRows.has(r.requestNo)) toggleRow(r.requestNo)
                                        else if (!checked && checkedRows.has(r.requestNo)) toggleRow(r.requestNo)
                                    })
                                }}
                            />
                        </TableHead>
                    )}
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Req No.</TableHead>
                    <TableHead>Group Head</TableHead>
                    <TableHead>Pay To</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Doc</TableHead>
                    <TableHead>Requestor</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.length > 0 ? (
                    data.map((req) => {
                        const isChecked = checkedRows.has(req.requestNo)
                        const inputs = rowInputs[req.requestNo] || { status: "", remarks: "" }

                        return (
                            <TableRow key={req.requestNo} className="hover:bg-slate-50">
                                {!isHistory && (
                                    <TableCell>
                                        <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={() => toggleRow(req.requestNo)}
                                        />
                                    </TableCell>
                                )}
                                <TableCell>
                                    {!isHistory ? (
                                        <Select
                                            value={inputs.status}
                                            onValueChange={(v) => handleInputChange(req.requestNo, "status", v)}
                                            disabled={!isChecked}
                                        >
                                            <SelectTrigger className="h-8 text-xs w-32 bg-white">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Approved" className="text-xs">Approved</SelectItem>
                                                <SelectItem value="Reject" className="text-xs">Reject</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${req.status1 === "Approved" ? "bg-green-100 text-green-700" :
                                            req.status1 === "Reject" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                                            }`}>
                                            {req.status1 || "--"}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {!isHistory ? (
                                        <Input
                                            placeholder="Add Note"
                                            className="h-8 text-xs w-40 bg-white"
                                            value={inputs.remarks}
                                            onChange={(e) => handleInputChange(req.requestNo, "remarks", e.target.value)}
                                            disabled={!isChecked}
                                        />
                                    ) : (
                                        <span className="text-xs text-slate-600 truncate max-w-[150px] inline-block" title={req.remarks1}>
                                            {req.remarks1 || "--"}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium text-purple-600 text-xs">{req.requestNo}</TableCell>
                                <TableCell className="text-xs">{req.groupHead}</TableCell>
                                <TableCell className="text-xs">{req.payTo}</TableCell>
                                <TableCell className="text-right font-semibold text-xs">
                                    ₹{new Intl.NumberFormat('en-IN').format(req.amount)}
                                </TableCell>

                                <TableCell className="text-center">
                                    {req.attachment ? (
                                        <a href={req.attachment} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline inline-flex items-center gap-1">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    ) : (
                                        <span className="text-slate-300">--</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-[10px] text-slate-500">{req.name}</TableCell>
                            </TableRow>
                        )
                    })
                ) : (
                    <TableRow>
                        <TableCell colSpan={isHistory ? 8 : 9} className="text-center py-12 text-slate-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-10" />
                            <p>No records found in this category.</p>
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
)

const ApprovalView: React.FC = () => {
    const { toast } = useToast()

    // State for data
    const [requests, setRequests] = useState<RequestEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // State for inline editing
    const [checkedRows, setCheckedRows] = useState<Set<string>>(new Set())
    const [rowInputs, setRowInputs] = useState<Record<string, { status: string; remarks: string }>>({})
    const [isUpdating, setIsUpdating] = useState<string | null>(null)

    const fetchRequests = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`${APP_SCRIPT_URL}?sheet=${REQUEST_SHEET_NAME}&action=fetch`)
            const jsonData = await response.json()

            if (jsonData.success && jsonData.data) {
                // Skip header rows (headers are on Row 6, data starts on Row 7 / index 6)
                // We need to keep track of the row index for updates.
                const rows = jsonData.data.slice(6)
                const parsedRequests: RequestEntry[] = rows
                    .map((row: any, index: number) => ({
                        rowIndex: index + 7, // 1-based index including headers
                        timestamp: String(row[0] || ""),
                        requestNo: String(row[1] || ""),
                        groupHead: String(row[2] || ""),
                        payTo: String(row[3] || ""),
                        amount: Number(row[4]) || 0,
                        remarks: String(row[5] || ""),
                        attachment: String(row[6] || ""),
                        name: String(row[7] || ""),
                        department: String(row[8] || ""),
                        planned: String(row[9] || ""),
                        actual: String(row[10] || ""),
                        delay: String(row[11] || ""),
                        status1: String(row[12] || ""),
                        remarks1: String(row[13] || ""),
                    }))
                    .filter((req: RequestEntry) => req.requestNo)

                // Sort by timestamp desc
                parsedRequests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                setRequests(parsedRequests)

                // Initialize inputs
                const initialInputs: Record<string, { status: string; remarks: string }> = {}
                parsedRequests.forEach(req => {
                    initialInputs[req.requestNo] = { status: req.status1, remarks: req.remarks1 }
                })
                setRowInputs(initialInputs)
            }
        } catch (error) {
            console.error("Error fetching requests:", error)
            toast({
                title: "Error",
                description: "Failed to load approval data.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const toggleRow = (requestNo: string) => {
        const next = new Set(checkedRows)
        if (next.has(requestNo)) next.delete(requestNo)
        else next.add(requestNo)
        setCheckedRows(next)
    }

    const handleInputChange = (requestNo: string, field: "status" | "remarks", value: string) => {
        setRowInputs(prev => ({
            ...prev,
            [requestNo]: { ...prev[requestNo], [field]: value }
        }))
    }

    const handleBulkUpdate = async () => {
        if (checkedRows.size === 0) return

        setIsUpdating("bulk")
        const loadingToast = toast({
            title: "Updating Requests...",
            description: `Processing ${checkedRows.size} selections.`,
            duration: 900000,
        })

        try {
            const today = new Date().toLocaleDateString("en-GB")

            // We'll perform updates sequentially for simplicity and reliability with common GS setups
            // but we'll use a single loading state.
            const selectedReqs = requests.filter(r => checkedRows.has(r.requestNo))

            for (const req of selectedReqs) {
                const inputs = rowInputs[req.requestNo] || { status: "", remarks: "" }
                const rowDataArray = new Array(14).fill("")
                rowDataArray[10] = today
                rowDataArray[12] = inputs.status
                rowDataArray[13] = inputs.remarks

                const params = new URLSearchParams({
                    action: "update",
                    sheetName: REQUEST_SHEET_NAME,
                    rowIndex: req.rowIndex.toString(),
                    rowData: JSON.stringify(rowDataArray)
                }).toString()

                await fetch(APP_SCRIPT_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: params,
                })
            }

            toast({ title: "Updated", description: `Successfully updated ${checkedRows.size} requests.` })
            fetchRequests()
            setCheckedRows(new Set())
        } catch (error: any) {
            console.error("Bulk update error:", error)
            toast({
                title: "Update Failed",
                description: "One or more updates failed. Please refresh and check the sheet.",
                variant: "destructive",
            })
        } finally {
            setIsUpdating(null)
            loadingToast.dismiss()
        }
    }

    // Filtering Logic:
    // Pending: Planned NOT NULL and Actual NULL
    const pendingRequests = requests.filter(req =>
        req.planned && !req.actual &&
        Object.values(req).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // History: Planned NOT NULL and Actual NOT NULL
    const historyRequests = requests.filter(req =>
        req.planned && req.actual &&
        Object.values(req).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <CheckCircle2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Approvals</h1>
                </div>

                <div className="flex items-center gap-4">
                    {checkedRows.size > 0 && (
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 shadow-md animate-in fade-in zoom-in duration-300"
                            onClick={handleBulkUpdate}
                            disabled={isUpdating !== null}
                        >
                            {isUpdating === "bulk" ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            Submit Selected ({checkedRows.size})
                        </Button>
                    )}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search approvals..."
                            className="pl-10 w-full md:w-64 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={fetchRequests}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="bg-slate-100 p-1 mb-4 h-12 w-full md:w-auto">
                    <TabsTrigger value="pending" className="flex items-center gap-2 h-10 px-8 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">
                        <Clock className="h-4 w-4" />
                        Pending
                        {pendingRequests.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-purple-600 text-white rounded-full">
                                {pendingRequests.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2 h-10 px-8 data-[state=active]:bg-white data-[state=active]:text-slate-600 data-[state=active]:shadow-sm">
                        <History className="h-4 w-4" />
                        History
                    </TabsTrigger>
                </TabsList>

                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                <p>Loading approval data...</p>
                            </div>
                        ) : (
                            <>
                                <TabsContent value="pending" className="m-0 focus-visible:ring-0">
                                    <RequestTable
                                        data={pendingRequests}
                                        isHistory={false}
                                        checkedRows={checkedRows}
                                        toggleRow={toggleRow}
                                        rowInputs={rowInputs}
                                        handleInputChange={handleInputChange}
                                        isUpdating={isUpdating}
                                    />
                                </TabsContent>
                                <TabsContent value="history" className="m-0 focus-visible:ring-0">
                                    <RequestTable
                                        data={historyRequests}
                                        isHistory={true}
                                        checkedRows={checkedRows}
                                        toggleRow={toggleRow}
                                        rowInputs={rowInputs}
                                        handleInputChange={handleInputChange}
                                        isUpdating={isUpdating}
                                    />
                                </TabsContent>
                            </>
                        )}
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    )
}

export default ApprovalView
