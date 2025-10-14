import { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { mockLeads } from "@/lib/mockData";
import { Download, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const LeadsSchema = () => {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [projectFilter, setProjectFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const rowsPerPage = 10;

  const filteredData = useMemo(() => {
    return mockLeads.filter(lead => {
      const matchesProject = !projectFilter || lead.projectName.toLowerCase().includes(projectFilter.toLowerCase());
      const matchesClient = !clientFilter || lead.customerName.toLowerCase().includes(clientFilter.toLowerCase());
      const matchesStatus = !statusFilter || lead.leadStatus === statusFilter;
      
      return matchesProject && matchesClient && matchesStatus;
    });
  }, [projectFilter, clientFilter, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(paginatedData.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
  };

  const handleDownload = () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No leads selected",
        description: "Please select at least one lead to download",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Download started",
      description: `Downloading ${selectedLeads.length} lead file(s)...`,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      'New': 'outline',
      'Qualified': 'secondary',
      'Converted': 'default',
      'Lost': 'destructive'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="finance" />
      
      <main className="container mx-auto px-4 pt-20 pb-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground mb-2">Leads Schema</h2>
          <p className="text-muted-foreground">Manage and track all leads</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
            <div className="flex flex-wrap gap-3 flex-1">
              <Input
                placeholder="Filter by project..."
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="max-w-[200px]"
              />
              <Input
                placeholder="Filter by client..."
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="max-w-[200px]"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="max-w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Status</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setSelectedLeads(filteredData.map(l => l.id))}
              >
                Select All
              </Button>
              <Button 
                onClick={handleDownload}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                disabled={selectedLeads.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Download ({selectedLeads.length})
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedLeads.length === paginatedData.length && paginatedData.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Lead ID</TableHead>
                  <TableHead>Project ID</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Lead Name</TableHead>
                  <TableHead>Lead Value (₹)</TableHead>
                  <TableHead>Lead Status</TableHead>
                  <TableHead>Validation File ID</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{lead.leadId}</TableCell>
                    <TableCell>{lead.projectId}</TableCell>
                    <TableCell>{lead.projectName}</TableCell>
                    <TableCell>{lead.customerId}</TableCell>
                    <TableCell>{lead.customerName}</TableCell>
                    <TableCell>{lead.leadName}</TableCell>
                    <TableCell className="font-semibold">₹{lead.leadValue.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{getStatusBadge(lead.leadStatus)}</TableCell>
                    <TableCell>{lead.validationFileId || '-'}</TableCell>
                    <TableCell>{lead.createdAt}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length} leads
            </p>
            
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LeadsSchema;
