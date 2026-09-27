import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button, InputGroup, Label, TextField, toast } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import MahallaScene from "../components/MahallaScene.jsx";
import api from "../config/api.js";

const LoginPage = () => {
  const navigate = useNavigate();

  // Check if the user is already logged in and redirect to the home page if they are
  const hasToken = localStorage.getItem("accessToken");
  if (hasToken) return <Navigate to="/" />;

  // State variables for managing form input and submission status
  const [accessToken, setAccessToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccessTokenVisible, setIsAccessTokenVisible] = useState(true);

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!accessToken) return;

    // Add loader
    setIsSubmitting(true);

    api
      .get("/api/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((user) => {
        localStorage.setItem("accessToken", accessToken);
        navigate("/", { state: { user } });
      })
      .catch((error) => {
        toast.danger(
          error?.message ||
            "Access key noto'g'ri yoki foydalanuvchi topilmadi.",
        );
        console.error("Login qilishda xatolik:", error);
      })
      .finally(() => setIsSubmitting(false));
  };

  // UI
  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-[#f1efe5] font-sans text-[#21372c] md:grid md:grid-cols-[minmax(0,1fr)_minmax(360px,34%)]">
      <div className="absolute inset-x-0 top-0 h-[46svh] min-h-62.5 bg-[#c7d9cc] md:inset-y-0 md:right-[34%] md:h-auto md:min-h-0">
        <MahallaScene />
      </div>

      <section className="relative z-10 mt-[42svh] flex min-h-[58svh] w-full items-center justify-center rounded-t-[28px] bg-[#f1efe5] px-7 py-12 shadow-[0_-18px_55px_rgba(28,47,36,0.12)] md:col-start-2 md:row-start-1 md:mt-0 md:min-h-svh md:rounded-none md:px-10 md:shadow-none lg:px-14">
        <div className="w-full max-w-sm">
          <h1 className="mb-8 text-3xl font-semibold text-[#20382c]!">
            Kirish
          </h1>

          {/* Form */}
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <TextField className="w-full" name="accessToken" isRequired>
              <Label>Token</Label>
              <InputGroup className="w-full">
                <InputGroup.Input
                  required
                  className="w-full"
                  name="accessToken"
                  autoComplete="off"
                  value={accessToken}
                  placeholder="Tokenni kiriting"
                  onChange={(e) => setAccessToken(e.target.value)}
                  type={isAccessTokenVisible ? "text" : "password"}
                />
                <InputGroup.Suffix className="pe-0">
                  <Button
                    size="sm"
                    isIconOnly
                    type="button"
                    variant="ghost"
                    aria-label={
                      isAccessTokenVisible
                        ? "Tokenni yashirish"
                        : "Tokenni ko'rsatish"
                    }
                    onPress={() =>
                      setIsAccessTokenVisible((visible) => !visible)
                    }
                  >
                    {isAccessTokenVisible ? (
                      <Eye aria-hidden="true" className="size-4" />
                    ) : (
                      <EyeOff aria-hidden="true" className="size-4" />
                    )}
                  </Button>
                </InputGroup.Suffix>
              </InputGroup>
            </TextField>

            {/* Submit Button */}
            <Button
              size="lg"
              fullWidth
              type="submit"
              variant="primary"
              isDisabled={isSubmitting}
            >
              {isSubmitting ? "Kirish..." : "Kirish"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
