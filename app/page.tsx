"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getWindowAI } from "window.ai";
import CanvasComponent from "@/components/canvas";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Loader } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

function InstallButton() {
  const handleClick = () => {
    window.open(
      "https://chrome.google.com/webstore/detail/window-ai/cbhbgmdpcoelfdoihppookkijpmgahag",
      "_blank"
    );
  };

  return <Button onClick={handleClick}>Install</Button>;
}

export default function Home() {
  const { toast } = useToast();
  const [objectLink, setObjectLink] = useState<string>(
    "A chair shaped like an avocado.ply"
  );
  const [inputText, setInputText] = useState("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [numInferenceSteps, setNumInferenceSteps] = useState<number>(32);
  const ai = useRef<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const windowAI = await getWindowAI();
        ai.current = windowAI;
        toast({ title: "window.ai detected." });
      } catch (error) {
        toast({
          title: "Please install window.ai",
          action: (
            <ToastAction asChild altText="install">
              <InstallButton></InstallButton>
            </ToastAction>
          ),
        });
      }
    };
    init();
  }, []);

  // Generate 3D object with window.ai. Supply a prompt and number of inference steps and receive a data URI.
  const generate3DObject = async () => {
    const promptObject = { prompt: inputText };
    const output = await ai.current.BETA_generate3DObject(promptObject, {
      extension: "application/x-ply",
      numInferenceSteps: numInferenceSteps,
    });

    return output[0].uri;
  };

  // Handle generation.
  const handleGenerate = async () => {
    try {
      setGenerating(true);
      if (!ai.current) {
        toast({ title: "Error loading window.ai." });
        return;
      }
      const dataUri = await generate3DObject();
      setObjectLink(dataUri);
    } catch (error) {
      toast({ title: "Error generating model." });
    } finally {
      setGenerating(false);
    }
  };
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = objectLink as string;
    link.download = inputText + ".ply";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="flex flex-col h-screen w-full">
      <Card className="h-full">
        <CardContent className="flex flex-col md:flex-row h-full">
          <div className="w-full md:w-1/2 h-2/3 overflow-auto p-1 md:ml-10 md:mt-10 -mb-20">
            <Label htmlFor="promptInput">Prompt</Label>
            <Input
              placeholder="A chair shaped like an avocado"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <Label htmlFor="numInferenceSteps">Quality</Label>
            <div className="mb-5">
              <Select
                onValueChange={(value: string) => setNumInferenceSteps(parseInt(value))}
                defaultValue="32"
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Quality " />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16">Low</SelectItem>
                  <SelectItem value="32">Medium</SelectItem>
                  <SelectItem value="64">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-row">
              <Button className="mr-3" onClick={handleGenerate}>
                {!generating ? "Generate Model" : <Loader className="spin" />}
              </Button>
              <Button className="mr-3" onClick={handleDownload}>
                Download Model
              </Button>
            </div>
          </div>
          <div className="w-full md:w-1/2 h-full overflow-auto p-1">
            {objectLink && <CanvasComponent objectLink={objectLink} />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}