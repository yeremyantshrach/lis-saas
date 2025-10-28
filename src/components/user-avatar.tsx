import { FC } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Session } from "@/lib/auth-client";
import { getInitials } from "@/lib/utils";

type AvatarProps = {
  image?: Session["user"]["image"];
  name: Session["user"]["name"];
};
export const UserAvatar: FC<AvatarProps> = ({ name, image }) => {
  const userInitials = getInitials(name);

  return (
    <Avatar className="h-8 w-8 rounded-lg grayscale">
      <AvatarImage src={image ?? ""} alt={name} />
      <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
    </Avatar>
  );
};
