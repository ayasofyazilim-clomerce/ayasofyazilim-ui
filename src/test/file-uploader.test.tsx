import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUploader } from "../custom/file-uploader";

const jsonFile = (name = "bundle.json") =>
  new File(["{}"], name, { type: "application/json" });

describe("FileUploader", () => {
  describe("with a single file", () => {
    it("lets the user remove the file it holds", async () => {
      const onValueChange = jest.fn();
      render(
        <FileUploader
          variant="dropzone"
          value={[jsonFile()]}
          onValueChange={onValueChange}
        />
      );
      const remove = screen.getByRole("button", { name: "Remove file" });
      expect(remove).toBeEnabled();
      await userEvent.click(remove);
      expect(onValueChange).toHaveBeenLastCalledWith([]);
    });

    it("keeps removal off while the whole uploader is disabled", () => {
      render(<FileUploader variant="dropzone" value={[jsonFile()]} disabled />);
      expect(
        screen.getByRole("button", { name: "Remove file" })
      ).toBeDisabled();
    });

    it("states its limit without a stray placeholder", () => {
      render(<FileUploader variant="dropzone" />);
      expect(
        screen.getByText("You can upload one file (up to 2 MB)")
      ).toBeInTheDocument();
      expect(screen.queryByText(/\{\d\}/)).not.toBeInTheDocument();
    });

    it("states its limit in the caller's words", () => {
      render(
        <FileUploader
          variant="dropzone"
          t={{ "FileUploader.CanUploadSingle": "Tek dosya ({0})" }}
        />
      );
      expect(screen.getByText("Tek dosya (2 MB)")).toBeInTheDocument();
    });
  });

  describe("with multiple files", () => {
    it("still opens its file list once it is full, so a file can be removed", () => {
      render(
        <FileUploader
          variant="dropzone"
          maxFileCount={2}
          value={[jsonFile("a.json"), jsonFile("b.json")]}
        />
      );
      expect(screen.getByRole("button", { name: "Files" })).toBeEnabled();
    });

    it("states its limit with both the count and the size", () => {
      render(<FileUploader variant="dropzone" maxFileCount={3} />);
      expect(
        screen.getByText("You can upload 3 files (up to 2 MB each)")
      ).toBeInTheDocument();
    });
  });
});
