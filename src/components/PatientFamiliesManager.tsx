import { useState } from 'react';
import { Users, Plus, Trash2, Edit2, UserPlus, Crown, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePatientFamilies, FamilyWithMembers } from '@/hooks/usePatientFamilies';
import { Patient } from '@/hooks/usePatients';
import { differenceInYears } from 'date-fns';

interface PatientFamiliesManagerProps {
  patients: Patient[];
}

const RELATIONSHIP_OPTIONS = [
  'Părinte',
  'Copil',
  'Soț',
  'Soție',
  'Frate',
  'Soră',
  'Bunic',
  'Bunică',
  'Nepot',
  'Nepoată',
  'Văr',
  'Verișoară',
  'Cumnat',
  'Cumnată',
  'Alt membru',
];

export function PatientFamiliesManager({ patients }: PatientFamiliesManagerProps) {
  const { families, loading, createFamily, updateFamily, deleteFamily, addMember, removeMember } = usePatientFamilies();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<FamilyWithMembers | null>(null);
  const [editingFamily, setEditingFamily] = useState<FamilyWithMembers | null>(null);
  
  // Form states
  const [familyName, setFamilyName] = useState('');
  const [familyPhone, setFamilyPhone] = useState('');
  const [familyAddress, setFamilyAddress] = useState('');
  const [familyNotes, setFamilyNotes] = useState('');
  
  // Add member states
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [isPrimaryContact, setIsPrimaryContact] = useState(false);

  const filteredFamilies = families.filter(f => 
    f.family_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.members.some(m => 
      `${m.patient.first_name} ${m.patient.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(memberSearchQuery.toLowerCase()) || 
                          p.phone.includes(memberSearchQuery);
    const notInFamily = selectedFamily ? 
      !selectedFamily.members.some(m => m.patient_id === p.id) : true;
    return matchesSearch && notInFamily;
  });

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null;
    return differenceInYears(new Date(), new Date(dateOfBirth));
  };

  const handleCreateFamily = async () => {
    if (!familyName.trim()) return;
    
    const result = await createFamily({
      family_name: familyName.trim(),
      primary_phone: familyPhone || undefined,
      address: familyAddress || undefined,
      notes: familyNotes || undefined,
    });
    
    if (result) {
      setShowCreateDialog(false);
      resetForm();
    }
  };

  const handleUpdateFamily = async () => {
    if (!editingFamily || !familyName.trim()) return;
    
    const success = await updateFamily(editingFamily.id, {
      family_name: familyName.trim(),
      primary_phone: familyPhone || null,
      address: familyAddress || null,
      notes: familyNotes || null,
    });
    
    if (success) {
      setEditingFamily(null);
      resetForm();
    }
  };

  const handleDeleteFamily = async (family: FamilyWithMembers) => {
    if (confirm(`Sigur doriți să ștergeți familia "${family.family_name}"?`)) {
      await deleteFamily(family.id);
    }
  };

  const handleAddMember = async () => {
    if (!selectedFamily || !selectedPatientId) return;
    
    const success = await addMember(
      selectedFamily.id,
      selectedPatientId,
      selectedRelationship || undefined,
      isPrimaryContact
    );
    
    if (success) {
      setShowAddMemberDialog(false);
      resetMemberForm();
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (confirm(`Sigur doriți să eliminați pe "${memberName}" din familie?`)) {
      await removeMember(memberId);
    }
  };

  const resetForm = () => {
    setFamilyName('');
    setFamilyPhone('');
    setFamilyAddress('');
    setFamilyNotes('');
  };

  const resetMemberForm = () => {
    setMemberSearchQuery('');
    setSelectedPatientId('');
    setSelectedRelationship('');
    setIsPrimaryContact(false);
  };

  const openEditDialog = (family: FamilyWithMembers) => {
    setEditingFamily(family);
    setFamilyName(family.family_name);
    setFamilyPhone(family.primary_phone || '');
    setFamilyAddress(family.address || '');
    setFamilyNotes(family.notes || '');
  };

  const openAddMemberDialog = (family: FamilyWithMembers) => {
    setSelectedFamily(family);
    setShowAddMemberDialog(true);
    resetMemberForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Grupuri de Familie</h2>
          <Badge variant="secondary">{families.length} familii</Badge>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Familie Nouă
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Caută familie sau membru..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Families Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFamilies.map((family) => (
          <Card key={family.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{family.family_name}</CardTitle>
                  {family.primary_phone && (
                    <CardDescription>{family.primary_phone}</CardDescription>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openAddMemberDialog(family)}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(family)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteFamily(family)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {family.members.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Niciun membru adăugat
                </p>
              ) : (
                <div className="space-y-2">
                  {family.members.map((member) => {
                    const age = calculateAge(member.patient.date_of_birth);
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 group"
                      >
                        <div className="flex items-center gap-2">
                          {member.is_primary_contact && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {member.patient.first_name} {member.patient.last_name}
                              {age !== null && (
                                <span className="text-muted-foreground font-normal ml-1">
                                  ({age} ani)
                                </span>
                              )}
                            </p>
                            {member.relationship && (
                              <p className="text-xs text-muted-foreground">
                                {member.relationship}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveMember(
                            member.id,
                            `${member.patient.first_name} ${member.patient.last_name}`
                          )}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              {family.notes && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                  {family.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFamilies.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? (
            <p>Nu s-au găsit familii pentru "{searchQuery}"</p>
          ) : (
            <div className="space-y-2">
              <Users className="h-12 w-12 mx-auto opacity-50" />
              <p>Nu există grupuri de familie create</p>
              <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Creează prima familie
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Family Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Familie Nouă</DialogTitle>
            <DialogDescription>
              Creează un grup de familie pentru a lega pacienții înrudiți.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="familyName">Numele Familiei *</Label>
              <Input
                id="familyName"
                placeholder="ex: Familia Popescu"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="familyPhone">Telefon Principal</Label>
              <Input
                id="familyPhone"
                placeholder="ex: 0721234567"
                value={familyPhone}
                onChange={(e) => setFamilyPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="familyAddress">Adresă</Label>
              <Input
                id="familyAddress"
                placeholder="ex: Str. Primăverii nr. 10"
                value={familyAddress}
                onChange={(e) => setFamilyAddress(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="familyNotes">Notițe</Label>
              <Textarea
                id="familyNotes"
                placeholder="Observații despre familie..."
                value={familyNotes}
                onChange={(e) => setFamilyNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Anulează
            </Button>
            <Button onClick={handleCreateFamily} disabled={!familyName.trim()}>
              Creează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Family Dialog */}
      <Dialog open={!!editingFamily} onOpenChange={() => setEditingFamily(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editează Familia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editFamilyName">Numele Familiei *</Label>
              <Input
                id="editFamilyName"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editFamilyPhone">Telefon Principal</Label>
              <Input
                id="editFamilyPhone"
                value={familyPhone}
                onChange={(e) => setFamilyPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editFamilyAddress">Adresă</Label>
              <Input
                id="editFamilyAddress"
                value={familyAddress}
                onChange={(e) => setFamilyAddress(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editFamilyNotes">Notițe</Label>
              <Textarea
                id="editFamilyNotes"
                value={familyNotes}
                onChange={(e) => setFamilyNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFamily(null)}>
              Anulează
            </Button>
            <Button onClick={handleUpdateFamily} disabled={!familyName.trim()}>
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adaugă Membru în Familie</DialogTitle>
            <DialogDescription>
              {selectedFamily?.family_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Caută Pacient</Label>
              <Input
                placeholder="Nume sau telefon..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
              />
            </div>
            
            {memberSearchQuery && (
              <ScrollArea className="h-48 border rounded-md">
                <div className="p-2 space-y-1">
                  {filteredPatients.slice(0, 20).map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-2 rounded cursor-pointer hover:bg-muted ${
                        selectedPatientId === patient.id ? 'bg-primary/10 border border-primary' : ''
                      }`}
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      <p className="font-medium">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{patient.phone}</p>
                    </div>
                  ))}
                  {filteredPatients.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nu s-au găsit pacienți
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}

            {selectedPatientId && (
              <>
                <div>
                  <Label>Relație în Familie</Label>
                  <Select value={selectedRelationship} onValueChange={setSelectedRelationship}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează relația..." />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_OPTIONS.map((rel) => (
                        <SelectItem key={rel} value={rel}>
                          {rel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={isPrimaryContact}
                    onChange={(e) => setIsPrimaryContact(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="isPrimary" className="cursor-pointer">
                    Contact principal al familiei
                  </Label>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
              Anulează
            </Button>
            <Button onClick={handleAddMember} disabled={!selectedPatientId}>
              Adaugă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
