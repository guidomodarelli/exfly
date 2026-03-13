import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GoogleAccountAvatar } from "./google-account-avatar";

describe("GoogleAccountAvatar", () => {
  it("renders connect action when session is disconnected", async () => {
    const user = userEvent.setup();
    const onConnect = jest.fn();

    render(
      <GoogleAccountAvatar
        onConnect={onConnect}
        onDisconnect={jest.fn()}
        status="unauthenticated"
        userImage={null}
        userName={null}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Conectar cuenta de Google" }),
    );

    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it("renders disconnect menu when session is connected", async () => {
    const user = userEvent.setup();
    const onDisconnect = jest.fn();

    render(
      <GoogleAccountAvatar
        onConnect={jest.fn()}
        onDisconnect={onDisconnect}
        status="authenticated"
        userImage={"https://example.com/avatar.png"}
        userName={"Gus Example"}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Cuenta de Google conectada" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Desconectar Google" }));

    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it("uses user initials as fallback when no profile image is available", () => {
    render(
      <GoogleAccountAvatar
        onConnect={jest.fn()}
        onDisconnect={jest.fn()}
        status="authenticated"
        userImage={null}
        userName={"Guido Modarelli"}
      />,
    );

    expect(screen.getByText("GM")).toBeInTheDocument();
  });
});
