
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter } from "./ui/card";

interface PipelineCardProps {
  contactId: string;
  contactNumber: string;
  lastContactDate: string | null;
  notes?: string;
  onClick?: () => void;
}

export const PipelineCard = ({
  contactId,
  contactNumber,
  lastContactDate,
  notes,
  onClick,
}: PipelineCardProps) => {
  return (
    <Card 
      className="w-full mb-3 cursor-pointer hover:border-primary transition-colors" 
      onClick={onClick}
    >
      <CardContent className="p-4">
        <h3 className="font-medium text-md">{contactId}</h3>
        <p className="text-sm text-muted-foreground">{contactNumber}</p>
        {lastContactDate && (
          <p className="text-xs mt-1 text-muted-foreground">
            Last contact: {formatDistanceToNow(new Date(lastContactDate))} ago
          </p>
        )}
      </CardContent>
      {notes && (
        <CardFooter className="p-4 pt-0 text-xs border-t">
          <p className="line-clamp-2">{notes}</p>
        </CardFooter>
      )}
    </Card>
  );
};
