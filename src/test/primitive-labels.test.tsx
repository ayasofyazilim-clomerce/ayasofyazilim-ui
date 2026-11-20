import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog, DialogContent, DialogTitle } from "../components/dialog";
import { Sheet, SheetContent, SheetTitle } from "../components/sheet";
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
} from "../components/sidebar";
import {
  Pagination,
  PaginationEllipsis,
  PaginationNext,
  PaginationPrevious,
} from "../components/pagination";
import { Breadcrumb, BreadcrumbEllipsis } from "../components/breadcrumb";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/carousel";
import { TourProvider, useTour } from "../components/tour";

let mockIsMobile = false;
jest.mock("../hooks/use-mobile", () => ({
  useIsMobile: () => mockIsMobile,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    ...props
  }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  window.matchMedia =
    window.matchMedia ||
    ((query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
        onchange: null,
      }) as unknown as MediaQueryList);
});

function DialogCase(props: { closeLabel?: string }) {
  return (
    <Dialog open>
      <DialogContent {...props}>
        <DialogTitle>t</DialogTitle>
      </DialogContent>
    </Dialog>
  );
}

function SheetCase(props: { closeLabel?: string }) {
  return (
    <Sheet open>
      <SheetContent {...props}>
        <SheetTitle>t</SheetTitle>
      </SheetContent>
    </Sheet>
  );
}

async function renderMobileSidebar(
  sidebarProps: { mobileTitle?: string; mobileDescription?: string } = {}
) {
  mockIsMobile = true;
  render(
    <SidebarProvider>
      <SidebarTrigger name="main" />
      <Sidebar name="main" {...sidebarProps}>
        content
      </Sidebar>
    </SidebarProvider>
  );
  await userEvent.click(screen.getByRole("button"));
}

function CarouselCase(props: {
  roleDescription?: string;
  itemRoleDescription?: string;
  prevLabel?: string;
  nextLabel?: string;
}) {
  return (
    <Carousel roleDescription={props.roleDescription}>
      <CarouselContent>
        <CarouselItem roleDescription={props.itemRoleDescription}>
          a
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious label={props.prevLabel} />
      <CarouselNext label={props.nextLabel} />
    </Carousel>
  );
}

function TourStarter() {
  const { start } = useTour();
  React.useEffect(() => start("t"), [start]);
  return (
    <div
      data-tour-step-id="s"
      ref={(el) => {
        if (el) {
          el.getBoundingClientRect = () =>
            ({
              width: 10,
              height: 10,
              left: 0,
              top: 0,
              right: 10,
              bottom: 10,
              x: 0,
              y: 0,
              toJSON: () => {},
            }) as DOMRect;
        }
      }}
    />
  );
}

function TourCase({ closeLabel }: { closeLabel?: string }) {
  return (
    <TourProvider
      closeLabel={closeLabel}
      tours={[{ id: "t", steps: [{ id: "s", title: "Step", content: "c" }] }]}
    >
      <TourStarter />
    </TourProvider>
  );
}

afterEach(() => {
  mockIsMobile = false;
});

describe("primitive labels: defaults reproduce today's text", () => {
  it("DialogContent close", () => {
    render(<DialogCase />);
    expect(screen.getByText("Close")).toHaveClass("sr-only");
  });
  it("SheetContent close", () => {
    render(<SheetCase />);
    expect(screen.getByText("Close")).toHaveClass("sr-only");
  });
  it("SidebarTrigger", () => {
    render(
      <SidebarProvider>
        <SidebarTrigger name="main" />
      </SidebarProvider>
    );
    expect(screen.getByText("Toggle Sidebar")).toHaveClass("sr-only");
  });
  it("Sidebar mobile title and description", async () => {
    await renderMobileSidebar();
    expect(screen.getByText("Sidebar")).toBeInTheDocument();
    expect(
      screen.getByText("Displays the mobile sidebar.")
    ).toBeInTheDocument();
  });
  it("Pagination", () => {
    const { container } = render(
      <Pagination>
        <PaginationPrevious href="#" />
        <PaginationNext href="#" />
        <PaginationEllipsis />
      </Pagination>
    );
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByText("More pages")).toHaveClass("sr-only");
    expect(screen.getByLabelText("Go to previous page")).toBeInTheDocument();
    expect(screen.getByLabelText("Go to next page")).toBeInTheDocument();
    expect(container.querySelector("nav")).toHaveAttribute(
      "aria-label",
      "pagination"
    );
  });
  it("Breadcrumb", () => {
    const { container } = render(
      <Breadcrumb>
        <BreadcrumbEllipsis />
      </Breadcrumb>
    );
    expect(screen.getByText("More")).toHaveClass("sr-only");
    expect(container.querySelector("nav")).toHaveAttribute(
      "aria-label",
      "breadcrumb"
    );
  });
  it("Carousel", () => {
    const { container } = render(<CarouselCase />);
    expect(container.querySelector('[data-slot="carousel"]')).toHaveAttribute(
      "aria-roledescription",
      "carousel"
    );
    expect(
      container.querySelector('[data-slot="carousel-item"]')
    ).toHaveAttribute("aria-roledescription", "slide");
    expect(screen.getByText("Previous slide")).toBeInTheDocument();
    expect(screen.getByText("Next slide")).toBeInTheDocument();
  });
  it("Tour close button", async () => {
    render(<TourCase />);
    expect(await screen.findByLabelText("Close")).toBeInTheDocument();
  });
});

describe("primitive labels: each label prop replaces its default", () => {
  it("DialogContent closeLabel", () => {
    render(<DialogCase closeLabel="X-closeLabel" />);
    expect(screen.getByText("X-closeLabel")).toBeInTheDocument();
    expect(screen.queryByText("Close")).not.toBeInTheDocument();
  });
  it("SheetContent closeLabel", () => {
    render(<SheetCase closeLabel="X-closeLabel" />);
    expect(screen.getByText("X-closeLabel")).toBeInTheDocument();
    expect(screen.queryByText("Close")).not.toBeInTheDocument();
  });
  it("SidebarTrigger label", () => {
    render(
      <SidebarProvider>
        <SidebarTrigger name="main" label="X-label" />
      </SidebarProvider>
    );
    expect(screen.getByText("X-label")).toBeInTheDocument();
    expect(screen.queryByText("Toggle Sidebar")).not.toBeInTheDocument();
  });
  it("Sidebar mobileTitle and mobileDescription", async () => {
    await renderMobileSidebar({
      mobileTitle: "X-mobileTitle",
      mobileDescription: "X-mobileDescription",
    });
    expect(screen.getByText("X-mobileTitle")).toBeInTheDocument();
    expect(screen.getByText("X-mobileDescription")).toBeInTheDocument();
    expect(screen.queryByText("Sidebar")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Displays the mobile sidebar.")
    ).not.toBeInTheDocument();
  });
  it("Pagination labels", () => {
    render(
      <Pagination>
        <PaginationPrevious href="#" label="X-prev" />
        <PaginationNext href="#" label="X-next" />
        <PaginationEllipsis label="X-ellipsis" />
      </Pagination>
    );
    expect(screen.getByText("X-prev")).toBeInTheDocument();
    expect(screen.getByText("X-next")).toBeInTheDocument();
    expect(screen.getByText("X-ellipsis")).toBeInTheDocument();
    expect(screen.queryByText("Previous")).not.toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
    expect(screen.queryByText("More pages")).not.toBeInTheDocument();
  });
  it("BreadcrumbEllipsis label", () => {
    render(<BreadcrumbEllipsis label="X-label" />);
    expect(screen.getByText("X-label")).toBeInTheDocument();
    expect(screen.queryByText("More")).not.toBeInTheDocument();
  });
  it("Carousel labels and roleDescriptions", () => {
    const { container } = render(
      <CarouselCase
        roleDescription="X-carousel"
        itemRoleDescription="X-slide"
        prevLabel="X-prev"
        nextLabel="X-next"
      />
    );
    expect(container.querySelector('[data-slot="carousel"]')).toHaveAttribute(
      "aria-roledescription",
      "X-carousel"
    );
    expect(
      container.querySelector('[data-slot="carousel-item"]')
    ).toHaveAttribute("aria-roledescription", "X-slide");
    expect(screen.getByText("X-prev")).toBeInTheDocument();
    expect(screen.getByText("X-next")).toBeInTheDocument();
    expect(screen.queryByText("Previous slide")).not.toBeInTheDocument();
    expect(screen.queryByText("Next slide")).not.toBeInTheDocument();
  });
  it("Tour closeLabel", async () => {
    render(<TourCase closeLabel="X-closeLabel" />);
    expect(await screen.findByLabelText("X-closeLabel")).toBeInTheDocument();
    expect(screen.queryByLabelText("Close")).not.toBeInTheDocument();
  });
});

describe("primitive labels: aria-label passes through", () => {
  it("Pagination", () => {
    const { container } = render(<Pagination aria-label="Sayfalama" />);
    expect(container.querySelector("nav")).toHaveAttribute(
      "aria-label",
      "Sayfalama"
    );
  });
  it("Breadcrumb", () => {
    const { container } = render(<Breadcrumb aria-label="Konum" />);
    expect(container.querySelector("nav")).toHaveAttribute(
      "aria-label",
      "Konum"
    );
  });
});

describe("primitive labels: new props are not forwarded to the DOM", () => {
  it("renders no label attributes", () => {
    const { container } = render(
      <>
        <PaginationEllipsis label="L" />
        <BreadcrumbEllipsis label="L" />
        <CarouselCase roleDescription="R" itemRoleDescription="R" />
      </>
    );
    expect(container.querySelector("[label]")).toBeNull();
    expect(container.querySelector("[roledescription]")).toBeNull();
  });
});
