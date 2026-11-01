import { Button } from "@acme/ui/button";
import { cn } from "@acme/ui";
import { Spinner } from "@acme/ui/spinner";

export function SubmitButton(props: { label: string; isPending: boolean }) {
  const { label, isPending } = props;

  return (
    <Button size="lg" type="submit" disabled={isPending} aria-label={label}>
      <span className="grid place-items-center">
        <span
          className={cn("col-start-1 row-start-1", isPending && "invisible")}
        >
          {label}
        </span>
        {isPending && (
          <Spinner className="col-start-1 row-start-1" aria-hidden />
        )}
      </span>
    </Button>
  );
}
