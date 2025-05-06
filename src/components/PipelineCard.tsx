
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter } from "./ui/card";
import { useNavigate } from "react-router-dom";

interface PipelineCardProps {
  contactId: string;
  contactNumber: string;
  lastContactDate: string | null;
  notes?: string;
  leadId: string;
  onClick?: () => void;
  firstName?: string;
  lastName?: string;
}

export const PipelineCard = ({
  contactId,
  contactNumber,
  lastContactDate,
  notes,
  leadId,
  onClick,
  firstName,
  lastName,
}: PipelineCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/lead/${leadId}`);
    }
  };

  // Display first and last name if available, otherwise use contact ID
  const displayName = firstName && lastName 
    ? `${firstName} ${lastName}` 
    : contactId;
  
  return (
    <Card 
      className="w-full mb-3 cursor-pointer hover:border-primary transition-colors" 
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <h3 className="font-medium text-md">{displayName}</h3>
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
