
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getTeamMembers, removeTeamMember, saveTeamMember, sendInvitationEmail, TeamMember } from "@/services/emailService";
import { UserPlus, Trash2, Mail } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const TeamMembersPage = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"viewer" | "editor">("viewer");
  const [isInviting, setIsInviting] = useState(false);
  
  useEffect(() => {
    if (user?.clientId) {
      const members = getTeamMembers(user.clientId);
      setTeamMembers(members);
    }
  }, [user]);
  
  const handleInviteMember = async () => {
    if (!user?.clientId) return;
    
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      toast.error("Please enter a name and email address");
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsInviting(true);
    
    try {
      // Add member to local storage
      const newMember = saveTeamMember(user.clientId, {
        name: newMemberName,
        email: newMemberEmail,
        role: newMemberRole
      });
      
      // Send invitation email
      const emailSent = await sendInvitationEmail(newMemberEmail, user.name);
      
      setTeamMembers([...teamMembers, newMember]);
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberRole("viewer");
      
      if (emailSent) {
        toast.success(`${newMemberName} has been invited to your team`);
      } else {
        toast.warning(`${newMemberName} was added, but the invitation email could not be sent`);
      }
    } catch (error) {
      console.error("Error inviting team member:", error);
      toast.error("There was an error inviting the team member");
    } finally {
      setIsInviting(false);
    }
  };
  
  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!user?.clientId) return;
    
    try {
      removeTeamMember(user.clientId, memberId);
      setTeamMembers(teamMembers.filter(member => member.id !== memberId));
      toast.success(`${memberName} has been removed from your team`);
    } catch (error) {
      console.error("Error removing team member:", error);
      toast.error("There was an error removing the team member");
    }
  };
  
  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Team Members</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Invite Team Members</CardTitle>
              <CardDescription>
                Invite your colleagues to access your CallTrax dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Enter name" 
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Enter email address" 
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={newMemberRole} 
                      onValueChange={(value: "viewer" | "editor") => setNewMemberRole(value)}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer (read-only)</SelectItem>
                        <SelectItem value="editor">Editor (can make changes)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={handleInviteMember} 
                  disabled={isInviting}
                  className="w-full sm:w-auto ml-auto flex items-center gap-2"
                >
                  <UserPlus size={16} />
                  <span>{isInviting ? "Sending Invitation..." : "Invite Team Member"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Current Team Members</CardTitle>
              <CardDescription>
                Manage access for your team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p>No team members yet. Invite your first team member above.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          {member.role === "owner" 
                            ? "Owner" 
                            : member.role === "editor" 
                              ? "Editor" 
                              : "Viewer"}
                        </TableCell>
                        <TableCell>
                          {new Date(member.addedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {member.role !== "owner" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon">
                                  <Trash2 size={16} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove team member</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove {member.name} from your team? 
                                    They will lose access to your CallTrax dashboard.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveMember(member.id, member.name)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TeamMembersPage;
