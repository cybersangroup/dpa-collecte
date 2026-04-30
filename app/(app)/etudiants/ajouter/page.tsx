import { Topbar } from "@/components/layout/Topbar";
import { StudentForm } from "@/components/forms/StudentForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export default function AjouterEtudiantPage() {
  return (
    <>
      <Topbar title="Ajouter un étudiant" />

      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto w-full">
          <Card>
            <CardHeader>
              <CardTitle>Nouvel étudiant</CardTitle>
              <CardDescription>
                Remplissez le formulaire pour enregistrer un étudiant lors de la tournée.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentForm mode="operateur" />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
