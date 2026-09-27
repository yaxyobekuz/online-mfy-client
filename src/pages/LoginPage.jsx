import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, InputGroup, Label, TextField } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import MahallaScene from "../components/MahallaScene.jsx";
import api from "../config/axios.js";

const LoginPage = () => {
  const navigate = useNavigate();
  const [isAccessKeyVisible, setIsAccessKeyVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const accessKey = new FormData(event.currentTarget)
      .get("accessKey")
      ?.toString()
      .trim();

    if (!accessKey) return;

    setIsSubmitting(true);

    try {
      const user = await api.get("/user", {
        headers: { Authorization: `Bearer ${accessKey}` },
      });

      sessionStorage.setItem("accessKey", accessKey);
      sessionStorage.setItem("user", JSON.stringify(user));

      navigate("/home", { state: { user } });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Access key noto‘g‘ri yoki server bilan bog‘lanib bo‘lmadi",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <TextField className="w-full" name="accessKey" isRequired>
              <Label>Access key</Label>
              <InputGroup className="w-full">
                <InputGroup.Input
                  className="w-full"
                  name="accessKey"
                  type={isAccessKeyVisible ? "text" : "password"}
                  autoComplete="off"
                  placeholder="Access key"
                  required
                />
                <InputGroup.Suffix className="pe-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    aria-label={
                      isAccessKeyVisible
                        ? "Access keyni yashirish"
                        : "Access keyni ko‘rsatish"
                    }
                    onPress={() => setIsAccessKeyVisible((visible) => !visible)}
                  >
                    {isAccessKeyVisible ? (
                      <Eye aria-hidden="true" className="size-4" />
                    ) : (
                      <EyeOff aria-hidden="true" className="size-4" />
                    )}
                  </Button>
                </InputGroup.Suffix>
              </InputGroup>
            </TextField>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <Button
              className="bg-[#d8e78d]! text-[#20382c]! hover:bg-[#c9db75]!"
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isDisabled={isSubmitting}
            >
              {isSubmitting ? "Yuborilmoqda..." : "Yuborish"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
