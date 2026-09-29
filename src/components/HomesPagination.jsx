import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Sodda oldingi/keyingi sahifalash. Xonadonlar minglab bo'lishi mumkin,
 * shuning uchun barcha sahifa raqamlarini emas, faqat joriy holat va
 * ikki tugmani ko'rsatamiz — bu ham DOM'ni yengil saqlaydi.
 */
const HomesPagination = ({ page, totalPages, total, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="text-sm text-foreground/60">
        {page}-sahifa / {totalPages} (jami {total} ta)
      </span>

      <div className="flex items-center gap-2">
        <Button
          onPress={() => onPageChange(page - 1)}
          isDisabled={page <= 1}
          variant="ghost"
          size="sm"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Oldingi
        </Button>

        <Button
          onPress={() => onPageChange(page + 1)}
          isDisabled={page >= totalPages}
          variant="ghost"
          size="sm"
        >
          Keyingi
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};

export default HomesPagination;
