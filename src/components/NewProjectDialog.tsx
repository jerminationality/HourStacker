"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppData } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ReactNode, useEffect } from "react";
import { Project } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(1, "Project name is required.").max(50, "Project name is too long."),
});

interface NewProjectDialogProps {
    children: ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectToEdit?: Project | null;
}

export function NewProjectDialog({ children, open, onOpenChange, projectToEdit }: NewProjectDialogProps) {
  const { addProject, updateProject } = useAppData();
  const isEditMode = !!projectToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });
  
  useEffect(() => {
    if (isEditMode && projectToEdit) {
        form.reset({
            name: projectToEdit.name,
        });
    } else {
        form.reset({
            name: "",
        })
    }
  }, [projectToEdit, open, form, isEditMode]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditMode && projectToEdit) {
      updateProject({ ...projectToEdit, name: values.name});
    } else {
      addProject(values.name);
    }
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Project" : "Create New Project"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the name of your project." : "Give your new project a name to start tracking hours."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Website Redesign" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{isEditMode ? "Save Changes" : "Create Project"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
