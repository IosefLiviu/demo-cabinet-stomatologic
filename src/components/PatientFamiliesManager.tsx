import { useState, useMemo } from 'react';
import { Users, Plus, Trash2, Edit2, UserPlus, Crown, X, Search, Sparkles, Check } from 'lucide-react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { usePatientFamilies, FamilyWithMembers } from '@/hooks/usePatientFamilies';
import { Patient } from '@/hooks/usePatients';
import { differenceInYears } from 'date-fns';
import { ChevronDown } from 'lucide-react';

interface PatientFamiliesManagerProps {
  patients: Patient[];
}

interface PotentialFamily {
  phone: string;
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
  const [potentialFamiliesOpen, setPotentialFamiliesOpen] = useState(true);
  const [creatingFromPotential, setCreatingFromPotential] = useState<PotentialFamily | null>(null);
  
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

  // Get all patient IDs that are already in families
  const patientsInFamilies = useMemo(() => {
    const ids = new Set<string>();
    families.forEach(f => f.members.forEach(m => ids.add(m.patient_id)));
    return ids;
  }, [families]);

  // Detect potential families - patients sharing same phone who aren't in families yet
  const potentialFamilies = useMemo(() => {
    const phoneGroups = new Map<string, Patient[]>();
    
    patients.forEach(patient => {
      // Skip patients already in families
      if (patientsInFamilies.has(patient.id)) return;
      
      // Normalize phone number (remove spaces, dashes)
      const normalizedPhone = patient.phone.replace(/[\s\-\.]/g, '');
      if (!normalizedPhone) return;
      
      const existing = phoneGroups.get(normalizedPhone) || [];
      existing.push(patient);
      phoneGroups.set(normalizedPhone, existing);
    });
    
    // Only keep groups with 2+ patients
    const result: PotentialFamily[] = [];
    phoneGroups.forEach((pts, phone) => {
      if (pts.length >= 2) {
        result.push({ phone, patients: pts });
      }
    });
    
    return result.sort((a, b) => b.patients.length - a.patients.length);
  }, [patients, patientsInFamilies]);

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

  const handleCreateFromPotential = async (potential: PotentialFamily) => {
    setCreatingFromPotential(potential);
    
    // Auto-generate family name from first patient's last name
    const firstPatient = potential.patients[0];
    const suggestedName = `Familia ${firstPatient.last_name}`;
    
    // Create the family
    const family = await createFamily({
      family_name: suggestedName,
      primary_phone: potential.phone,
    });
    
    if (family) {
      // Add all patients as members
      for (let i = 0; i < potential.patients.length; i++) {
        const patient = potential.patients[i];
        await addMember(family.id, patient.id, undefined, i === 0);
      }
    }
    
    setCreatingFromPotential(null);
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

      {/* Potential Families Detection */}
      {potentialFamilies.length > 0 && (
        <Collapsible open={potentialFamiliesOpen} onOpenChange={setPotentialFamiliesOpen}>
          <Card className="border-dashed border-primary/50 bg-primary/5">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-primary/10 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Familii Potențiale Detectate</CardTitle>
                    <Badge variant="secondary" className="bg-primary/20">
                      {potentialFamilies.length} grupuri
                    </Badge>
                  </div>
                  <ChevronDown className={`h-5 w-5 transition-transform ${potentialFamiliesOpen ? 'rotate-180' : ''}`} />
                </div>
                <CardDescription>
                  Pacienți care împărtășesc același număr de telefon
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {potentialFamilies.map((potential) => (
                    <div
                      key={potential.phone}
                      className="p-3 rounded-lg border bg-background"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {potential.phone}
                        </span>
                        <Badge variant="outline">{potential.patients.length} pacienți</Badge>
                      </div>
                      <div className="space-y-1 mb-3">
                        {potential.patients.map((patient) => {
                          const age = calculateAge(patient.date_of_birth);
                          return (
                            <p key={patient.id} className="text-sm">
                              {patient.first_name} {patient.last_name}
                              {age !== null && (
                                <span className="text-muted-foreground ml-1">({age} ani)</span>
                              )}
                            </p>
                          );
                        })}
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleCreateFromPotential(potential)}
                        disabled={creatingFromPotential?.phone === potential.phone}
                      >
                        {creatingFromPotential?.phone === potential.phone ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full mr-2" />
                            Se creează...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Creează Familie
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

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
