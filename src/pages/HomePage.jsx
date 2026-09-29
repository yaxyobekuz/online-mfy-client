import { useEffect, useState } from "react";
import { Button, Spinner, Table } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import api from "../config/api";

const columns = [
  { id: "name", name: "Nomi" },
  { id: "population", name: "Aholi soni" },
  { id: "homes", name: "Uylar soni" },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [streets, setStreets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    api
      .get("/api/streets")
      .then((data) => setStreets(data))
      .catch(() => {
        toast.error("Ko'chalarni yuklashda xatolik yuz berdi.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const updateStreets = () => {
    setIsUpdating(true);

    api
      .post("/api/streets/update")
      .then((data) => {
        setStreets(data);
        toast.success("Ko'chalar yangilandi");
      })
      .catch(() => {
        toast.error("Ko'chalarni yangilashda xatolik yuz berdi.");
      })
      .finally(() => setIsUpdating(false));
  };

  return (
    <div className="py-5">
      <div className="container">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-foreground">Ko'chalar</h1>

          <Button
            onPress={updateStreets}
            isDisabled={isUpdating}
            variant="secondary"
          >
            <RefreshCw
              className={`size-4 ${isUpdating ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Ko'chalarni yangilash
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
          </div>
        ) : streets.length === 0 ? (
          <p className="py-10 text-center text-sm text-foreground/60">
            Hozircha ko'chalar mavjud emas. "Ko'chalarni yangilash" tugmasini
            bosing.
          </p>
        ) : (
          <Table aria-label="Ko'chalar jadvali">
            <Table.Content>
              <Table.Header columns={columns}>
                {(column) => (
                  <Table.Column isRowHeader={column.id === "name"}>
                    {column.name}
                  </Table.Column>
                )}
              </Table.Header>

              <Table.Body items={streets}>
                {(street) => (
                  <Table.Row
                    id={street._id}
                    onAction={() => navigate(`/streets/${street.streetId}`)}
                  >
                    <Table.Cell>{street.name}</Table.Cell>
                    <Table.Cell>
                      {street.populationSurveyedCount ?? 0}
                    </Table.Cell>
                    <Table.Cell>{street.homesCount ?? 0}</Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table>
        )}
      </div>
    </div>
  );
};

export default HomePage;
